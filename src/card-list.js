
export const CardList = (user_entries) => {
    const user_entries_with_card = user_entries.filter((entry) => entry.card)
    return (
        $('<div class="sidebar-section card-list">').append(
            Collapsible({
                collapsed_content: $(`<span>Karty zniżkowe (<strong>${user_entries_with_card.length}</strong>)</span>`),
                content: user_entries_with_card.map(Entry),
            })
            // $('<div class="sidebar-section-content">').append(
            // )
        )
    )
}

const Entry = (entry) => $(`
    <div class="card-list-entry">
        <a href="/clients/c/${entry.user.id}/" target="blank">${entry.user.label}</a>
    </div>
`)


const Collapsible = ({collapsed_content, content}) => (
    $('<details class="collapsible">').append(
        $('<summary class="collapsible-collapsed-content">').append(collapsed_content),
        $('<div class="collapsible-content">').append(...content),
    )
)


const RESERVISE_COLOURS = {
    panel_hover: '#fafafa',
    panel_border: '#c5c5c5',
}

const card_list_style = `
.card-list-entry + .card-list-entry {
    margin-top: 0.5em;
}

`

const collapsible_style = `
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
    padding: 1em;
    outline: 1px solid ${RESERVISE_COLOURS.panel_border};
    background-color: rgba(0,0,0, 0.03); 
}
`

export const style = card_list_style + '\n' + collapsible_style

// const Entry = (entry) => $(`
//     <div class="custom-user-entry" style="display:flex; justify-content: space-between; align-items: center;">
//         <span style="flex-basis:100%"><a href="/clients/c/${entry.user.id}/" target="blank">${entry.user.label}</a></span>
//         ${(entry.card) ? '<span class="badge" style="flex-basis: 15%;">MS</span>' : ''}
//     </div>
// `)
