import { create_client } from './reservise-api'
import { show_error } from './reservise-ui'


export function CustomInput(user_entries, props) {
    this.state = this.initial_state(user_entries)
    this.props = props
}


CustomInput.prototype.initial_state = function(user_entries) {
    return {
        state: 'search',
        user: null,
        lastname:  null,
        firstname: null,
        card: false,
        user_entries: user_entries,
    }
}

CustomInput.prototype.set_state = function(updates) {
    let old_state = this.state
    this.state = Object.assign({}, old_state, updates)
    this.rerender()
    if ('user_entries' in updates && !Object.is(old_state.user_entries, this.state.user_entries)) {
        this.client_entries_render()
        this.props.on_user_entries_change(this.state.user_entries)
    }
}


CustomInput.prototype.rerender = function() {
    let state = this.state.state
    // console.log('CustomInput.rerender', state)
    if (state === 'search') {
        let user = this.state.user

        this.elems.$search.show()
        this.elems.$create.hide()

        if (user === null) {
            this.elems.$submit.prop('disabled', true)
            this.elems.$clear.hide()
        } else {
            this.elems.$submit.prop('disabled', false)
            this.elems.$clear.show()
        }

    } else if (state === 'create') {
        this.elems.$search.hide()
        this.elems.$create.show()
        this.elems.$clear.show()

        let lastname  = this.state.lastname
        let firstname = this.state.firstname
        if (!firstname || !lastname) {
            this.elems.$submit.prop('disabled', true)
        } else {
            this.elems.$submit.prop('disabled', false)
        }

    } else {
        throw new Error(`Invalid custom_input state: "${state}"`)
    }
}

CustomInput.prototype.switch_to_create = function({firstname = '', lastname = ''}) {
    this.set_state({state: 'create', firstname: firstname, lastname: lastname})
    this.elems.$lastname.val(lastname).focus()
    this.elems.$firstname.val(firstname)
    // this.elems.$create.change()
    this.rerender()
}

CustomInput.prototype.clear = function() {
    // let _state = this.state.state
    // if (state === 'search') {
        this.elems.$search.val('')
        this.elems.$search.userProfileAutocomplete2('search', '')
    // } else if (state === 'create') {
        this.elems.$create.val('')
    // } else {
    //     throw new Error(`Invalid custom_input state: "${state}"`)
    // }
    this.elems.$card.prop('checked', false)
    this.set_state(this.initial_state(this.state.user_entries))
}

CustomInput.prototype.render = function() {
    let $elem = $(`
        <div class="custom-wrapper divWrapper setPaddingLR setPaddingTB" data-extracted="null">
            <h5 class="gray" style="margin-bottom: 5px">Gracze</h5>
            <div class="divWrapper">
                <div class="custom-add-user" style="display:flex; flex-direction: row">
                    <input class="custom-add-user-search form-control" type="text" placeholder="Nazwisko klienta lub numer telefonu" style="border-top-right-radius: 0px; border-bottom-right-radius: 0px; border-right: none;">
                    <input class="custom-add-user-create custom-add-user-create-lastname  form-control" type="text" placeholder="Nazwisko" style="flex-basis:40%; min-width: 0; border-top-right-radius: 0px; border-bottom-right-radius: 0px; border-right: none;">
                    <input class="custom-add-user-create custom-add-user-create-firstname form-control" type="text" placeholder="Imię"     style="flex-basis:40%; min-width: 0; border-radius: 0px;">
                    <button class="custom-add-user-clear close" tabindex="-1" style="opacity: inherit; border-color: #e1e1e1; border-style: solid; border-width: 1px 0px;">
                        &nbsp;×&nbsp;
                    </button>
                    <div style="flex-shrink: 0; padding-left: 0.5em; padding-right: 0.5em; border: 1px solid #e1e1e1; display: flex; align-items: center;">
                        <span>MS</span>
                        <input type="checkbox" class="custom-add-user-card" style="width: auto; margin: initial; margin-left: 5px; display: inline;">
                    </div>
                    <button class="custom-add-user-submit btn btn-primary" style="border-top-left-radius: 0px; border-bottom-left-radius: 0px; background: #3276b1; /*font-weight: bold;*/ padding: initial; line-height: initial; padding-left: 10px; padding-right: 10px; font-size: 23px;">+</button>
                </div>
                <ul class="custom-user-entry-list list-group" style="margin-top: 0.7em"></ul>
            </div>
        </div>
    `)
    $elem.find('.custom-user-entry-list')

    this.elems = {
        $root:   $elem,
        $search: $elem.find('.custom-add-user-search'),
        $create: $elem.find('.custom-add-user-create'),
        $submit: $elem.find('.custom-add-user-submit'),
        $clear:  $elem.find('.custom-add-user-clear'),
        $lastname:  $elem.find('.custom-add-user-create-lastname'),
        $firstname: $elem.find('.custom-add-user-create-firstname'),
        $card: $elem.find('.custom-add-user-card'),
        $user_entry_list: $elem.find('.custom-user-entry-list'),
    }
    this.client_entries_render()
    this.init_handlers()
    this.rerender()
    return this.elems.$root
}

CustomInput.prototype.client_entries_render = function() {
    let state = this.state
    let user_entry_list = this.elems.$user_entry_list
    user_entry_list.empty().append(
        client_entries_render(state.user_entries)
    )
    this.client_entries_init_handlers()
    return user_entry_list    
} 

const client_entries_render = (user_entries) => ( 
    user_entries.map((entry, i) =>
        $('<li class="list-group-item"></li>').append(user_entry_render(entry, i))
    )
)

const user_entry_render = (entry, i) => (
    $(`
    <div class="custom-user-entry" style="display:flex; justify-content: space-between; align-items: center;">
        <span style="flex-basis:100%"><a href="/clients/c/${entry.user.id}/" target="blank">${entry.user.label}</a></span>
        ${(entry.card) ? '<span class="badge" style="flex-basis: 15%;">MS</span>' : ''}
        <button class="custom-user-entry-remove close" data-index="${i}" tabindex="-1" style="margin-left: 0.5em;">
            &nbsp;×&nbsp;
        </button>
    </div>
    `)
)

CustomInput.prototype.client_entries_init_handlers = function() {
    let user_entry_list = this.elems.$user_entry_list
    user_entry_list.find('.custom-user-entry-remove').click((event) => {
        let index = Number(event.target.getAttribute('data-index'))
        this.set_state({user_entries: remove_index([...this.state.user_entries], index)})
        // this.modify_data((data) => {
        //     data.users.splice(index, 1)
        //     return data
        // })
    })
}

const remove_index = (xs, i) => {xs.splice(i, 1); return xs}
const append = (xs, x) => {xs.push(x); return xs}

const promise_pure = (x) => (new Promise((resolve)=>resolve(x)))

const title_case_word = (word) => (
    word ? word[0].toUpperCase() + word.substr(1).toLowerCase() : word
)

const parse_name = (s) => {
    let parts = s.trim().split(' ').map(title_case_word)
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

// CustomInput.prototype.switch_to_search = function({user = null}) {
//     this.state.state = 'search'
//     this.state.user = user
//     this.rerender()
//     this.elems.$lastname.val(lastname).focus()
//     this.elems.$firstname.val(firstname)
//     this.elems.$create.change()
//     this.rerender()
// }


CustomInput.prototype.submit = function() {
    let state = this.state.state
    let user_promise, card
    if (state === 'search') {
        card = this.state.card
        user_promise = promise_pure(this.state.user)
    } else if (state === 'create') {
        card = this.state.card
        let lastname  = this.state.lastname
        let firstname = this.state.firstname
        // console.log('creating user', lastname, firstname)
        user_promise = create_client({last_name: lastname, first_name: firstname}).then((client) => (
            {id: client.id, label: lastname + ' ' + firstname} 
        ))
    } else {
        throw new Error(`Invalid custom_input state: "${state}"`)
    }

    return (
        user_promise
            .then((user) => {
                let entry = {user: user, card: card}
                this.set_state({user_entries: append([...this.state.user_entries], entry)})
            })
            .catch((err) => show_error(err.message))
    )
}

CustomInput.prototype.init_handlers = function() {
    this.elems.$search.userProfileAutocomplete2({
        showAddClient: true,
        // withFunds: true,
        minLength: 4,
        focus: (evt, ui) => {
            let item = ui.item
            if ('is_add_new_client' in item) {
                // set the input's value to the last thing searched.
                // if the user had to down-arrow through a few options
                // to choose "add new user", the input box would contain
                // the last thing from the select list.
                let search_input = $(evt.target)
                let search_widget = search_input.data('customUserProfileAutocomplete2')
                search_input.val(search_widget.term)
                return false
            }
        },
        select: (evt, ui) => {
            let item = ui.item
            if ('is_add_new_client' in item) {
                // create new client
                // let search = evt.target.value
                let search_widget = $(evt.target).data('customUserProfileAutocomplete2')
                let search = search_widget.term
                let [lastname, firstname] = parse_name(search)
                this.switch_to_create({firstname: firstname, lastname: lastname})
                return false
            } else {
                // select existing client
                let user = (item === null) ? null : {id: item.id, label: item.label}
                this.set_state({user: user})
            }
        }
    })

    this.elems.$lastname.change((event) => {
        let lastname = event.target.value
        this.set_state({lastname: lastname})
    })
    this.elems.$firstname.change((event) => {
        let firstname = event.target.value
        this.set_state({firstname: firstname})
    })

    this.elems.$card.change((event) => {
        let has_card = event.target.checked
        this.set_state({card: has_card})
    })

    this.elems.$submit.click(() => {
        this.submit().then(() => this.clear())
    })

    this.elems.$clear.click(() => {
        this.clear()
    })
    
}
