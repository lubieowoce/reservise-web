const RegExp_escape = (s) => {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // $& means the whole matched string
    // return s.replace(/[.*+\-?\^${}()|[\]\\]/g, '\\$&');
}

const SEPARATOR_RAW   = '---'
const SEPARATOR       = '\n'+SEPARATOR_RAW+'\n'
const SEPARATOR_REGEX =  new RegExp(`^${RegExp_escape(SEPARATOR_RAW)}$`, 'm') //  /m - each line separately


export const parse = (ann) => {
    let match = ann.match(SEPARATOR_REGEX)
    let val, ann_text
    if (match === null) {
        // console.log('parse ::', 'no separator found', ann)
        ann_text = ann
        val = null
    } else {
        // console.log('parse ::', 'found separator', match)
        ann_text = ann.substring(0, match.index - 1) // before leading newline
        let ann_val = ann.substring(match.index + match[0].length + 1) // after trailing newline
        // console.log('parse ::', 'value', ann_val)
        val = JSON.parse(ann_val)
    }
    return [ann_text, val]
}

export const get_text = (ann) => parse(ann)[0]
export const get_data = (ann) => parse(ann)[1]

export const serialize = (ann_text, data) => (
    ann_text + ((data === null) ? "" : (SEPARATOR + JSON.stringify(data)))
)


