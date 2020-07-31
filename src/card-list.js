const noop = () => {}

export const CardList = ({
        user_entries,
        className = "",
        on_show_reservation = noop,
        on_sync_cards = noop
    }) => {
    const user_entries_with_card = user_entries.filter((entry) => entry.card)

    const Entry = ({event_id, user: {id, label}}) => (
        $(`<div class="card-list-entry" style="display: flex; justify-content: space-between;">`).append(
            $(`<a href="/clients/c/${id}/" style="overflow: hidden" target="blank">${label}</a>`),
            $(`<a href="#"><span class="glyphicon glyphicon-calendar"></span></a>`).click(() => on_show_reservation(event_id)),
        )
    )

    return (
        $(`<div class="card-list ${className}">`).append(
            Collapsible({
                collapsed_content: $(`<span>Karty zniżkowe (<strong>${user_entries_with_card.length}</strong>)</span>`),
                content: [
                    $(`<div style="padding: 1em;">`).append(
                        ...user_entries_with_card.map(Entry),
                    ),
                    $(`<button class="btn" style="display: block; width: 100%">
                        <span class="glyphicon glyphicon-refresh"></span>
                        Synchronizuj karty
                      </button>`).click(on_sync_cards),
                ],
            })
            // $('<div class="sidebar-section-content">').append(
            // )
        )
    )
}

export const sync = ({old: old_card_list, new: new_card_list}) => {
    const open = old_card_list.children('details.collapsible').attr('open') 
    new_card_list.children('details.collapsible').attr('open', open)
}


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
