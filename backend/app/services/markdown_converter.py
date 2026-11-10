from __future__ import annotations

from typing import Any

from markdown_it import MarkdownIt
from markdown_it.token import Token


_parser = MarkdownIt("commonmark", {"html": False, "linkify": False, "typographer": False})


def _inline_to_tiptap(tokens: list[Token] | None) -> list[dict[str, Any]]:
    if not tokens:
        return []

    output: list[dict[str, Any]] = []
    active_marks: list[dict[str, Any]] = []
    mark_openers = {
        "strong_open": {"type": "bold"},
        "em_open": {"type": "italic"},
        "s_open": {"type": "strike"},
        "code_inline": {"type": "code"},
    }
    closing_to_type = {
        "strong_close": "bold",
        "em_close": "italic",
        "s_close": "strike",
    }

    for token in tokens:
        if token.type in mark_openers and token.type != "code_inline":
            active_marks.append(mark_openers[token.type])
            continue
        if token.type in closing_to_type:
            mark_type = closing_to_type[token.type]
            for index in range(len(active_marks) - 1, -1, -1):
                if active_marks[index]["type"] == mark_type:
                    active_marks.pop(index)
                    break
            continue

        text_value: str | None = None
        marks = list(active_marks)
        if token.type == "text":
            text_value = token.content
        elif token.type == "code_inline":
            text_value = token.content
            marks = [*marks, {"type": "code"}]
        elif token.type in ("softbreak", "hardbreak"):
            text_value = "\n"
        elif token.type == "image":
            # The frontend does not enable image nodes; preserve alt text instead.
            text_value = token.content or token.attrGet("alt") or ""

        if text_value:
            node: dict[str, Any] = {"type": "text", "text": text_value}
            if marks:
                node["marks"] = marks
            output.append(node)

    return output


def _parse_blocks(tokens: list[Token], start: int = 0, stop_type: str | None = None) -> tuple[list[dict[str, Any]], int]:
    nodes: list[dict[str, Any]] = []
    index = start

    while index < len(tokens):
        token = tokens[index]
        if stop_type and token.type == stop_type:
            return nodes, index + 1

        if token.type in ("paragraph_open", "heading_open"):
            is_heading = token.type == "heading_open"
            inline = tokens[index + 1] if index + 1 < len(tokens) and tokens[index + 1].type == "inline" else None
            text_content = _inline_to_tiptap(inline.children if inline else None)
            if is_heading:
                level = int(token.tag[1:]) if token.tag.startswith("h") else 1
                nodes.append({"type": "heading", "attrs": {"level": level}, "content": text_content} if text_content else {"type": "heading", "attrs": {"level": level}})
                close_type = "heading_close"
            else:
                nodes.append({"type": "paragraph", "content": text_content} if text_content else {"type": "paragraph"})
                close_type = "paragraph_close"
            index += 2 if inline else 1
            while index < len(tokens) and tokens[index].type != close_type:
                index += 1
            index += 1
            continue

        if token.type in ("bullet_list_open", "ordered_list_open"):
            list_type = "bulletList" if token.type == "bullet_list_open" else "orderedList"
            list_node: dict[str, Any] = {"type": list_type, "content": []}
            if list_type == "orderedList":
                start_value = token.attrGet("start")
                if start_value and start_value != "1":
                    list_node["attrs"] = {"start": int(start_value)}
            index += 1
            while index < len(tokens) and tokens[index].type != ("bullet_list_close" if list_type == "bulletList" else "ordered_list_close"):
                if tokens[index].type == "list_item_open":
                    item_nodes, index = _parse_blocks(tokens, index + 1, "list_item_close")
                    list_node["content"].append({"type": "listItem", "content": item_nodes or [{"type": "paragraph"}]})
                else:
                    index += 1
            index += 1
            nodes.append(list_node)
            continue

        if token.type == "blockquote_open":
            children, index = _parse_blocks(tokens, index + 1, "blockquote_close")
            nodes.append({"type": "blockquote", "content": children or [{"type": "paragraph"}]})
            continue

        if token.type in ("fence", "code_block"):
            code_text = token.content.rstrip("\n")
            code_node: dict[str, Any] = {"type": "codeBlock"}
            if code_text:
                code_node["content"] = [{"type": "text", "text": code_text}]
            nodes.append(code_node)
            index += 1
            continue

        if token.type == "hr":
            nodes.append({"type": "horizontalRule"})
            index += 1
            continue

        # Ignore inline wrappers, HTML, and other unsupported block tokens.
        index += 1

    return nodes, index


def markdown_to_tiptap(markdown: str) -> dict[str, Any]:
    tokens = _parser.parse(markdown)
    nodes, _ = _parse_blocks(tokens)
    return {"type": "doc", "content": nodes or [{"type": "paragraph"}]}


def text_to_tiptap(text: str) -> dict[str, Any]:
    # Blank lines split paragraphs; preserve single newlines within a paragraph.
    paragraphs = [part.strip() for part in text.replace("\r\n", "\n").replace("\r", "\n").split("\n\n")]
    nodes = []
    for paragraph in paragraphs:
        if not paragraph:
            continue
        nodes.append({"type": "paragraph", "content": [{"type": "text", "text": paragraph.replace("\n", "\n")}]})
    return {"type": "doc", "content": nodes or [{"type": "paragraph"}]}
