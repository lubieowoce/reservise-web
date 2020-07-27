
export const CardList = (user_entries) => {
    const user_entries_with_card = user_entries.filter((entry) => entry.card)
    return (
        $('<div class="sidebar-section">').append(
            $(`<h4>Karty zniżkowe (${user_entries_with_card.length})</h4>`),
            $('<div class="sidebar-section-content">').append(
                user_entries_with_card.map(Entry)
            )
        )
    )
}

const concat = (xs) => xs.reduce((a, b) => a + b, "")

const Entry = (entry) => $(`
    <div class="cardlist-entry">
        <a href="/clients/c/${entry.user.id}/" target="blank">${entry.user.label}</a>
    </div>
`)

// const Entry = (entry) => $(`
//     <div class="custom-user-entry" style="display:flex; justify-content: space-between; align-items: center;">
//         <span style="flex-basis:100%"><a href="/clients/c/${entry.user.id}/" target="blank">${entry.user.label}</a></span>
//         ${(entry.card) ? '<span class="badge" style="flex-basis: 15%;">MS</span>' : ''}
//     </div>
// `)
