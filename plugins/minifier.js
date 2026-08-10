function run(code) {

    // =========== Basic minifier

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

    // =========== Advanced minifier

    code = convertClassAttributes(code);
    code = shortenHexColors(code);
    code = processProperties(code);
    code = replaceUnits(code);

    return code;
}

function replaceUnits(code) {
    const pixelLengths = {
        ch: 8,
        pt: 4 / 3,
        pc: 16,
        vw: 4,
        vh: 3,
        in: 96,
        ex: 7.16,
        em: 16,
        mm: 96 / 25.4,
        q: 96 / 101.6,
        px: 1
    };
    const units = Object.keys(pixelLengths);

    return code.replace(/(-?\d*\.?\d+)(px|vw|vh|pc|pt|ch|in|ex|em|mm|q)\b/g, (_, value, unit) => {
        const px = parseFloat(value) * pixelLengths[unit];
        let best = value + unit;

        for (const target of units) {
            const converted = px / pixelLengths[target];
            let str = Number(converted.toFixed(6))
                .toString()
                .replace(/^(-?)0\./, "$1.");
            if (str === "-0")
                str = "0";
            const candidate =
                str === "0"
                    ? "0"
                    : str + target;
            if (candidate.length < best.length)
                best = candidate;
        }
        return best;
    });
}

function convertClassAttributes(code) {
    code = code.replace(/\sclass=(?:"([^"]+)"|'([^']+)'|(\w+))/gi, (_, q1, q2, q3) => {
        const cls = (q1 || q2 || q3).split(/\s+/)[0];
        return ` ${cls}`;
    });
    return code.replace(/\.([a-zA-Z_-][\w-]*)\{/g, '[$1]{');
}

function shortenHexColors(code) {
    return code.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/gi, (_, r, g, b) => `#${r}${g}${b}`);
}

function stripPx(value) {
    return value.replace(/(-?\d*\.?\d+)px\b/g, '$1');
}

function convertTransform(value) {
    const props = [];
    let remaining = value;

    for (const [fn, re] of [
        ['translate', /translate\s*\(([^)]+)\)/gi],
        ['rotate', /rotate\s*\(([^)]+)\)/gi],
        ['scale', /scale\s*\(([^)]+)\)/gi],
    ]) {
        remaining = remaining.replace(re, (_, args) => {
            props.push(`${fn}:${args.trim()}`);
            return '';
        });
    }

    remaining = remaining.replace(/[\s,]+/g, '');
    if (remaining)
        props.unshift(`transform:${remaining}`);

    return props;
}

function processProperties(code) {
    return code.replace(/(margin|padding|height|width):([^;{}]+)/g, (_, prop, value) =>
        `${prop}:${stripPx(value)}`
    ).replace(/transform:([^;{}]+)/g, (_, value) =>
        convertTransform(value).join(';')
    );
}