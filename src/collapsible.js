
import React, {
    useState, useCallback,
} from 'react'

export const Collapsible = ({content, isOpen=false, onToggle, children, className="", ...props}) => (
    <details className={`collapsible ${className}`} open={isOpen} onToggle={onToggle} {...props}>
        <summary className="collapsible-collapsed-content">
            {content}
        </summary>
        <div className="collapsible-content">
            {children}
        </div>
    </details>
)

export const useToggle = (initial) => {
    const [value, setValue] = useState(initial)
    const toggleValue = useCallback(() => setValue((prev) => !prev), [])
    return [value, toggleValue]
}


const RESERVISE_COLOURS = {
    panel_hover: '#fafafa',
    panel_border: '#c5c5c5',
}

Collapsible.style = `
details.collapsible {
}

details.collapsible > summary {
    display: block !important;
    width: 100%;
    padding: 1em;
    outline: 1px solid ${RESERVISE_COLOURS.panel_border};
    cursor: pointer;
}

details.collapsible > summary:hover {
    background-color: ${RESERVISE_COLOURS.panel_hover};
}

details.collapsible > summary::after       {
    opacity: 0.35;
    float: right;
    transform: rotate(0deg);
    transition: transform 0.25s ease-in;
}
details.collapsible > summary::after       { content: '▼'; }
details.collapsible[open] > summary::after { transform: rotate(180deg); }

details.collapsible > .collapsible-content {
    width: 100%;
    outline: 1px solid ${RESERVISE_COLOURS.panel_border};
    background-color: rgba(0,0,0, 0.03); 
}
`