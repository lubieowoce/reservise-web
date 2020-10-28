import { create_client } from './reservise-api'
import { show_error } from './reservise-ui'

export function AddClientWidget(user_entries, props) {
    this.state = this.initial_state(user_entries)
    this.props = props
}


AddClientWidget.prototype.initial_state = function(user_entries) {
    return {
        mode: 'search',
        user: null,
        lastname:  null,
        firstname: null,
        card: false,
        user_entries: user_entries,
    }
}


AddClientWidget.prototype.set_state = function(updates) {
    let old_state = this.state
    this.state = {...old_state, ...updates}
    this.reconcile()
    if ('user_entries' in updates && !Object.is(old_state.user_entries, this.state.user_entries)) {
        this.client_entries_render()
        this.props.on_user_entries_change(this.state.user_entries)
    }
}


AddClientWidget.prototype.render = function() {
    const {reservation_owner} = this.props
    const show_add_owner_button = (
        reservation_owner &&
        !this.state.user_entries.some(({user, card}) => card && (user.id === reservation_owner.id))
    )
    const $elem = $(`
        <div class="custom-wrapper divWrapper setPaddingLR setPaddingTB" data-extracted="null">
            <h5 class="gray" style="margin-bottom: 5px">Gracze</h5>
            <div class="divWrapper">
                <div class="custom-add-user" style="display: flex; flex-direction: row">
                    <input class="custom-add-user__search form-control" type="text" placeholder="Nazwisko klienta lub numer telefonu" style="border-top-right-radius: 0px; border-bottom-right-radius: 0px; border-right: none;">
                    <input class="custom-add-user__create custom-add-user__create-lastname  form-control" type="text" placeholder="Nazwisko" style="flex-basis:40%; min-width: 0; border-top-right-radius: 0px; border-bottom-right-radius: 0px; border-right: none;">
                    <input class="custom-add-user__create custom-add-user__create-firstname form-control" type="text" placeholder="Imię"     style="flex-basis:40%; min-width: 0; border-radius: 0px;">
                    <button class="custom-add-user__clear close" tabindex="-1" style="opacity: inherit; border-color: #e1e1e1; border-style: solid; border-width: 1px 0px;">
                        &nbsp;×&nbsp;
                    </button>
                    <div style="flex-shrink: 0; padding-left: 0.5em; padding-right: 0.5em; border: 1px solid #e1e1e1; display: flex; align-items: center;">
                        <span>MS</span>
                        <input type="checkbox" class="custom-add-user__card" style="width: auto; margin: initial; margin-left: 5px; display: inline;">
                    </div>
                    <button class="custom-add-user__submit btn btn-primary" style="border-top-left-radius: 0px; border-bottom-left-radius: 0px; background: #3276b1; /*font-weight: bold;*/ padding: initial; line-height: initial; padding-left: 10px; padding-right: 10px; font-size: 23px;">+</button>
                </div>
                <ul class="custom-add-user__user-entry-list list-group" style="margin-top: 0.7em; margin-bottom: 0.7em"></ul>
                ${show_add_owner_button ? (
                    `<button class="btn custom-add-user__add-owner" style="display: block; width: 100%; opacity: 0.6; border-color: currentColor; font-size: 0.8em;">
                        dodaj <strong>${reservation_owner.label}</strong>
                    </button>`
                ) : ''}
            </div>
        </div>
    `)

    this.elems = {
        $root:   $elem,
        $search: $elem.find('.custom-add-user__search'),
        $create: $elem.find('.custom-add-user__create'),
        $submit: $elem.find('.custom-add-user__submit'),
        $clear:  $elem.find('.custom-add-user__clear'),
        $lastname:  $elem.find('.custom-add-user__create-lastname'),
        $firstname: $elem.find('.custom-add-user__create-firstname'),
        $card: $elem.find('.custom-add-user__card'),
        $user_entry_list: $elem.find('.custom-add-user__user-entry-list'),
        $add_owner: $elem.find('.custom-add-user__add-owner'),
    }
    this.client_entries_render()
    this.init_handlers()
    this.reconcile()
    return this.elems.$root
}


AddClientWidget.prototype.init_handlers = function() {
    this.elems.$search.userProfileAutocomplete2({
        showAddClient: true,
        // withFunds: true,
        minLength: 2,
        focus: (evt, ui) => {
            const item = ui.item
            if ('is_add_new_client' in item) {
                // set the input's value to the last thing searched.
                // if the user had to down-arrow through a few options
                // to choose "add new user", the input box would contain
                // the last thing from the select list.
                const search_input = $(evt.target)
                const search_widget = search_input.data('customUserProfileAutocomplete2')
                search_input.val(search_widget.term)
                return false
            }
        },
        select: (evt, ui) => {
            const item = ui.item
            if ('is_add_new_client' in item) {
                const search_widget = $(evt.target).data('customUserProfileAutocomplete2')
                const search = search_widget.term
                const [lastname, firstname] = parse_name(search)
                this.switch_to_create({firstname: firstname, lastname: lastname})
                return false
            } else {
                // select existing client
                const user = (item === null) ? null : {id: item.id, label: item.label}
                this.set_state({user: user})
            }
        }
    })

    this.elems.$lastname.change((event) => {
        const lastname = event.target.value
        this.set_state({lastname: lastname})
    })
    this.elems.$firstname.change((event) => {
        const firstname = event.target.value
        this.set_state({firstname: firstname})
    })

    this.elems.$card.change((event) => {
        const has_card = event.target.checked
        this.set_state({card: has_card})
    })

    this.elems.$submit.click(() => {
        this.submit().then(() => this.clear())
    })

    this.elems.$clear.click(() => {
        this.clear()
    })
    
    this.elems.$add_owner.click(() => {
        if (!this.props.reservation_owner) { return }
        const entry = {user: this.props.reservation_owner, card: true}
        this.set_state({user_entries: append([...this.state.user_entries], entry)})
    })
}


AddClientWidget.prototype.reconcile = function() {
    const {mode, card} = this.state
    this.elems.$card.prop('checked', card)
    if (mode === 'search') {
        const {user} = this.state

        this.elems.$search.show()
        this.elems.$create.hide()

        if (user === null) {
            this.elems.$submit.prop('disabled', true)
            this.elems.$clear.hide()
        } else {
            this.elems.$submit.prop('disabled', false)
            this.elems.$clear.show()
        }

    } else if (mode === 'create') {
        this.elems.$search.hide()
        this.elems.$create.show()
        this.elems.$clear.show()

        const {lastname, firstname} = this.state
        if (!firstname || !lastname) {
            this.elems.$submit.prop('disabled', true)
        } else {
            this.elems.$submit.prop('disabled', false)
        }

    } else {
        throw new Error(`Invalid custom_input mode: "${mode}"`)
    }
}


AddClientWidget.prototype.switch_to_create = function({firstname = '', lastname = ''}) {
    this.set_state({mode: 'create', firstname: firstname, lastname: lastname})
    this.elems.$lastname.val(lastname).focus()
    this.elems.$firstname.val(firstname)
    this.reconcile()
}

AddClientWidget.prototype.clear = function() {
    this.elems.$search.val('')
    this.elems.$search.userProfileAutocomplete2('search', '')
    this.elems.$create.val('')
    this.set_state(this.initial_state(this.state.user_entries))
}

AddClientWidget.prototype.submit = function() {
    const {mode} = this.state
    let user_promise, card
    if (mode === 'search') {
        card = this.state.card
        user_promise = promise_pure(this.state.user)
    } else if (mode === 'create') {
        card = this.state.card
        const {lastname, firstname} = this.state
        user_promise = create_client({last_name: lastname, first_name: firstname}).then((client) => (
            {id: client.id, label: lastname + ' ' + firstname} 
        ))
    } else {
        throw new Error(`Invalid custom_input mode: "${mode}"`)
    }

    return (
        user_promise
            .then((user) => {
                const entry = {user, card}
                this.set_state({user_entries: append([...this.state.user_entries], entry)})
            })
            .catch((err) => {
                const msg = (
                    typeof err === 'object' && err.message !== undefined
                        ? err.message
                        : 'Unknown error'
                )
                console.error('Error submitting user', this.state, err)
                show_error(msg)
            })
    )
}




AddClientWidget.prototype.client_entries_render = function() {
    const {user_entries} = this.state
    const user_entry_list = this.elems.$user_entry_list
    user_entry_list.empty().append(
        client_entries_render(user_entries)
    )
    this.client_entries_init_handlers()
    return user_entry_list
} 

const client_entries_render = (user_entries) => ( 
    user_entries.map((entry, i) =>
        $('<li class="list-group-item"></li>').append(user_entry_render(entry, i))
    )
)

const user_entry_render = ({user, card}, i) => (
    $(`
    <div class="custom-user-entry" style="display:flex; justify-content: space-between; align-items: center;">
        <span style="flex-basis:100%"><a href="/clients/c/${user.id}/" target="blank">${user.label}</a></span>
        ${(card) ? '<span class="badge" style="flex-basis: 15%;">MS</span>' : ''}
        <button class="custom-user-entry-remove close" data-index="${i}" tabindex="-1" style="margin-left: 0.5em;">
            &nbsp;×&nbsp;
        </button>
    </div>
    `)
)

AddClientWidget.prototype.client_entries_init_handlers = function() {
    const user_entry_list = this.elems.$user_entry_list
    user_entry_list.find('.custom-user-entry-remove').click((event) => {
        const index = Number(event.target.getAttribute('data-index'))
        this.set_state({user_entries: remove_index([...this.state.user_entries], index)})
    })
}

const remove_index = (xs, i) => {xs.splice(i, 1); return xs}
const append = (xs, x) => {xs.push(x); return xs}

const promise_pure = (x) => (new Promise((resolve)=>resolve(x)))

const title_case_word = (word) => (
    word ? word[0].toUpperCase() + word.substr(1).toLowerCase() : word
)

const parse_name = (s) => {
    const parts = s.trim().split(' ').map(title_case_word)
    let lastname, firstname
    if (parts.length === 0) {
        lastname  = ''
        firstname = ''
    } else if (parts.length === 1) {
        lastname  = parts[0]
        firstname = ''
    } else {
        lastname  = parts.slice(0, -1).join(' ')
        firstname = parts[parts.length-1]
    }
    return [lastname, firstname]
}








