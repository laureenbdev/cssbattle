function run(code) {
    function formatCSS(css) {
        let result = "";
        let indent = 0;
        let inString = false;
        let quote = "";

        const tabs = () => "  ".repeat(indent);

        css = css.trim();

        for (let i = 0; i < css.length; i++) {
            const c = css[i];

            if ((c === '"' || c === "'") && css[i - 1] !== "\\") {
                if (!inString) {
                    inString = true;
                    quote = c;
                } else if (quote === c) {
                    inString = false;
                }
            }

            if (!inString) {
                if (c === "{") {
                    result += " {\n";
                    indent++;
                    result += tabs();
                    continue;
                }

                if (c === "}") {
                    indent--;
                    result = result.trimEnd();
                    result += "\n" + tabs() + "}\n" + tabs();
                    continue;
                }

                if (c === ";") {
                    result += ";\n" + tabs();
                    continue;
                }

                if (c === "," || c === "%" || c === ")" || c === ":") {
                    if (c === ",") {
                        result = result.replace(/ +$/, "");
                    }
                    result += c;
                    const next = css[i + 1];
                    if (next && next !== " " && next !== "\n" && next !== "}" && next !== ";" && next !== ")" && next !== ",") {
                        result += " ";
                    }
                    continue;
                }
            }

            result += c;
        }

        return result.trim();
    }

    code = code
        .replace(/\<\!--\s*?[^\s?\[][\s\S]*?--\>/g,'')
        .replace(/\>\s*\</g,'><')
        .replace(/\/\*.*\*\/|\/\*[\s\S]*?\*\/|\n|\t|\v|\s{2,}/g,'')
        .replace(/\s*\{\s*/g,'{')
        .replace(/\s*\}\s*/g,'}')
        .replace(/\s*\:\s*/g,':')
        .replace(/\s*\;\s*/g,';')
        .replace(/\s*\,\s*/g,',')
        .replace(/\s*\~\s*/g,'~')
        .replace(/\s*\>\s*/g,'>')
        .replace(/\s*\+\s*/g,'+')
        .replace(/\s*\!\s*/g,'!')
        .replaceAll('transparent','#0000')
        .replaceAll(') ',')')
        .replaceAll('/ ','/')
        .replaceAll(' /','/')
        .replaceAll(';}','}')
        .replace('</style>', '')
        .replaceAll('% ', '%')
        .replace(/ #/g, '#')
        .replace(/color:#/gi, 'color:')
        .replace(/;$/, '');

    const parts = code
        .replace(/\r?\n/g, "")
        .replace(/>\s+</g, "><")
        .split(/(<[^>]+>)/g)
        .filter(Boolean);

    let out = "";

    for (const part of parts) {
        if (/^<style>/i.test(part)) {
            out += "<style>\n";
        } else if (/^<\/style>/i.test(part)) {
            out = out.trimEnd();
            out += "\n</style>\n";
        } else if (/^<[^>]+>$/.test(part)) {
            out += part + "\n";
        } else if (out.endsWith("<style>\n")) {
            out += formatCSS(part) + "\n";
        }
    }

    return out.trim();
}