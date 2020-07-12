// 2020.03.03-r3

/* eslint-env jquery */

/* eslint no-global-assign: "off" */
/* eslint no-unused-vars: ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }] */
/* eslint no-prototype-builtins: "off" */

/* global
    ich
    calendar, venue
    urlReverse
    Message, messages
    BaseReservationEvent, ReservationStub, ReservationEvent
    ReservationDetailsPopover, cleanPopovers
*/

/* global
    old_ReservationDetailsPopover

    _refreshPopovers
    RegExp_escape

    parse_annotation_data
    get_annotation_data
    get_annotation_text
    modify_annotation_data
    serialize_annotation_data

    popover_annotation
    modify_popover_annotation
    get_event_details_uninited_annotation_tag
    get_popover_annotation
    serialize_popover_data
    save_popover_data
    modify_popover_annotation_data
    write_popover_data
    
    get_benefit_reservation
    create_client
    
    is_class_reservation 
    is_unavailability    
    is_single_reservation
    
    count_cards
    card_count_badge_state
    card_count_badge_render

    spinner_small
    html_entities_decode
    fetch_event_price_info
    parse_class_reservation
    class_event_reservations
    class_event_reservations_raw
    group_by
    add_benefit_reservation
    
    VENUE_PRICE_INFO
*/




_refreshPopovers = () => {
    cleanPopovers();
    (Object.values(calendar.reservationsById)
        .filter((e)=>e.detailsPopover)
        .forEach((e)=>{
            e.detailsPopover.outdate();
            e.detailsPopover.destroy();
            e.createDetailsPopover();
        })
    );
}

{
    RegExp_escape = (s) => {
        return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // $& means the whole matched string
        // return s.replace(/[.*+\-?\^${}()|[\]\\]/g, '\\$&');
    }

    const SEPARATOR_RAW   = '---'
    const SEPARATOR       = '\n'+SEPARATOR_RAW+'\n'
    const SEPARATOR_REGEX =  new RegExp('^'+RegExp_escape(SEPARATOR_RAW)+'$', 'm') //  /m - each line separately


    parse_annotation_data = (ann) => {
        let val, ann_text
        let match = ann.match(SEPARATOR_REGEX)
        if (match === null) {
            // console.log('parse_annotation_data ::', 'no separator found', ann)
            ann_text = ann
            val = null
        } else {
            // console.log('parse_annotation_data ::', 'found separator', match)
            ann_text = ann.substring(0, match.index - 1) // before leading newline
            let ann_val = ann.substring(match.index + match[0].length + 1) // after trailing newline
            // console.log('parse_annotation_data ::', 'value', ann_val)
            val = JSON.parse(ann_val)
        }
        return [ann_text, val]
    }

    get_annotation_text = (ann) => parse_annotation_data(ann)[0]
    get_annotation_data = (ann) => parse_annotation_data(ann)[1]

    serialize_annotation_data = (ann_text, data) => (
        ann_text + ((data === null) ? "" : (SEPARATOR + JSON.stringify(data)))
    )

    // modify_annotation_data = (ann, f) => {
    //     const INITIAL_STATE = {}

    //     let [ann_text, SEPARATOR, val] = parse_annotation_data(ann)
    //     let val2 = f((val === null) ? INITIAL_STATE : val)
    //     return [ann_text, SEPARATOR, JSON.stringify(val2)].join('')
    // }
}

popover_annotation = (popover) => {
    let event_details = popover.popoverContent[0] // .event-details
    // let event_ann = event_details.querySelector('#popoverReservationAnnotation').children[0].querySelector('.smartform-enabled, .smartform-disabled, .smartform-static')
    let ann_wrapper = event_details.querySelector('#popoverReservationAnnotation li:not(.custom-wrapper)')
    return ann_wrapper.querySelector('.smartform-enabled, .smartform-disabled, .smartform-static')
}

modify_popover_annotation = (popover, f) => {
    let ann = popover_annotation(popover)
    // console.log('popover annotation', ann)
    let $ann = $(ann)
    let ann_sf = $ann.data('bs.smartform')
    ann_sf.enable()
    let val = ann_sf.inputElements().val()
    ann_sf.inputElements().val(f(val))
    ann_sf.submit()
    ann_sf.makestatic()
    // ann_sf.cancel()
}

// get_popover_annotation = (popover) => {
//     let ann = popover_annotation(popover)
//     console.log('popover annotation', ann)
//     let $ann = $(ann)
//     if (ann.classList.contains('smartform-static')) {
//         console.log('static')
//         return $ann.find('.form-control-static[replaced="TEXTAREA"]')[0].innerText
//     } else {
//         console.log('active')
//         return $ann.find('[name="annotation"]').val()
//     }
// }

get_event_details_uninited_annotation_tag = (event_details) => {
    return event_details.querySelector('[name="annotation"]')
}

get_popover_annotation = (popover) => {
    let ann = popover_annotation(popover)
    // console.log('popover annotation', ann)
    let $ann = $(ann)
    let ann_sf = $ann.data('bs.smartform')
    ann_sf.enable()
    let val = ann_sf.inputElements().val()
    ann_sf.makestatic()
    return val
}

write_popover_data = (popover, data) => {
    let old_ann = get_popover_annotation(popover)
    let ann_text = get_annotation_text(old_ann)
    let new_ann = serialize_annotation_data(ann_text, data)
    modify_popover_annotation(popover, (_)=>new_ann)
}

// serialize_popover_data = (popover) => {
//     let $custom_input = $(popover.popoverContent[0]).find('.custom-wrapper')
//     let data_serialized = $custom_input.attr('data-extracted')
//     let data = JSON.parse(data_serialized)
//     let [ann_text, sep, _] = parse_annotation_data(get_popover_annotation(popover))
//     return ann_text + ((data === null) ? "" : (sep + data_serialized))
// }

// save_popover_data = (popover) => {
//     let ann = serialize_popover_data(popover)
//     modify_popover_annotation(popover, (_) => ann)
// }

// modify_popover_annotation_data = (popover, f) => {
//     let $custom_input = $(popover.popoverContent[0]).find('.custom-wrapper')
//     let data = JSON.parse($custom_input.attr('data-extracted')) || {users: []}
//     let new_data = f(data)
//     let new_data_serialized = JSON.stringify(new_data)
//     $custom_input.attr('data-extracted', new_data_serialized)
//     save_popover_data(popover)
// }

get_benefit_reservation = () => (
    Object.entries(calendar.reservationsById)
        .filter(([_id, r]) => (
            r.event !== undefined &&
            ['rsv-active', 'class-event'].every((cls) => r.event.className.includes(cls)) &&
            r.event.title.search(/karty zniżkowe/i) !== -1 &&
            calendar.date.isSame(r.event.start, 'day')
            // document.contains(getp(r, ['element', 0]))
        )) [0][1]
)

create_client = ({last_name, first_name}) => (
    $.ajax({
        type: 'GET', url: '/clients/create/client/', dataType: 'json',
    }).then((data)=> {
        let csrf = (data.html.match(/<input type='hidden' name='csrfmiddlewaretoken' value='(.+?)'/) || [null, null])[1]
        if (!csrf) {
            throw new Error('no csrf token found' + JSON.stringify(data))
        }
        return $.ajax({type: 'POST', url: '/clients/create/client/',  dataType: 'json', data: {
            csrfmiddlewaretoken: csrf,
            annotation: '',
            first_name: first_name,
            last_name: last_name,
            email: '',
            phone_number: '',
            discount: 0,
            enable_sms_notifications: 'on',
            enable_creating_reservations: 'on',
            is_new_player: 'on',
            birth_date: '',
            address: '',
            zip_code: '',
            venue: venue.id, // global
        }})
    }).then((res) => (
        {id: Number(res.client_info_url.match(/\/clients\/client\/(\d+)\//)[1])}
    ))
)


// inject a method to be called when an element
//    <xyz smartforms-action="inject_custom_data">
// is clicked.
// (see SmartForm.setHandlers and SmartForm.handleActionClick)

// when the user edits and saves the annotation,
// we need to reinject the extracted data.
// otherwise, all the custom data would be lost!

// IDEA: SmartForm.transitionTo(new_state) calls this[old_state+"2"+new_state]
// we could use this to inject some code to extract the stored data during init!

$.fn.smartform.Constructor.prototype.inject_custom_data = function(_event) {
    // console.log('SmartForm.inject_custom_data', this, _event)
    // let data = this.$element.data('get_custom_data')()
    let data = this.get_custom_data()
    this.inputElements().val((_i, ann) => {
        let ann_text = get_annotation_text(ann)
        let new_ann = serialize_annotation_data(ann_text, data)
        console.log('new annotation', new_ann)
        return new_ann
    })
    // this.inputElements().val(new_ann)
}


is_class_reservation  = (event) => event.client_list_url !== undefined
is_unavailability     = (event) => event.className.includes('unavailability')
is_single_reservation = (event) => !is_class_reservation(event) && !is_unavailability(event)




// custom input stuff
function CustomInput(user_entries, props) {
    this.state = this.initial_state(user_entries)
    this.props = props
}

(() => {
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

            let lastname  = this.state.lastname
            let firstname = this.state.firstname
            if (!firstname || !lastname) {
                this.elems.$submit.prop('disabled', true)
                this.elems.$clear.hide()
            } else {
                this.elems.$submit.prop('disabled', false)
                this.elems.$clear.show()
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
        let state = this.state.state
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
            _client_entries_render(state.user_entries)
        )
        this.client_entries_init_handlers()
        return user_entry_list    
    } 

    const _client_entries_render = (user_entries) => ( 
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
        let parts = s.split(' ').map(title_case_word)
        let lastname, firstname
        if (!parts) {
            lastname  = ''
            firstname = ''
        } else if (parts.length == 1) {
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

        return user_promise.then((user) => {
            let entry = {user: user, card: card}
            this.set_state({user_entries: append([...this.state.user_entries], entry)})
            // this.modify_data((data) => {
            //     if (!('users' in data)) { data.users = [] }
            //     data.users.push(entry)
            //     return data
            // })
        })

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

})()


if (typeof old_ReservationDetailsPopover === 'undefined') {
    old_ReservationDetailsPopover = ReservationDetailsPopover
}


ReservationDetailsPopover = function(event_id, refetch_func, attachment_func) {
    console.log('intercepted!', event_id)
    var self = new old_ReservationDetailsPopover(event_id, refetch_func, attachment_func);
    // console.log('self', self)

    self.old_showPopover = self.showPopover
    self.showPopover = function () {
        self.old_showPopover()
        let popover = self.popoverContent[0]
        popover.focus() // doesn't seem to have any effect, maybe it's not visible yet?
    }
    self.show = self.showPopover // rebind alias

    self.old_createPopoverContentFromResponse = self.createPopoverContentFromResponse
    self.createPopoverContentFromResponse = function(data) {
        // console.log('createPopoverContentFromResponse', self)
        self.old_createPopoverContentFromResponse(data)
        let popover  = self.popoverContent[0]
        let $popover = $(popover)
        // self.selected_price = $popover.find('[data-price-list-id]').attr('data-price-list-id')
        let event = $popover.data('event')
        // console.log('event', event)
        if (event !== undefined && !is_single_reservation(event)) {
            // console.log('createPopoverContentFromResponse :: not a single_reservation, ignoring', event)
            return
        }


        let $ann_tag = $(get_event_details_uninited_annotation_tag(popover))
        let [ann_text, ann_data] = parse_annotation_data($ann_tag.val())
        $ann_tag.val(ann_text)

        ann_data = ann_data || {users: []}
        let user_entries = ann_data.users
        self.custom_input = new CustomInput(user_entries, {
            on_user_entries_change: (user_entries) => (
                write_popover_data(self, user_entries ? {users: user_entries} : null)
            )
        })
        let el = $popover.children('.tab-content')
        el.before(self.custom_input.render())

        // see inject_custom_data(...) above for explanation
        let $ann_form = $ann_tag.closest('form')
        let $save_ann = $ann_form.find('[type="submit"]')
        $save_ann.attr('smartform-action', "inject_custom_data")
    };


    self.old_afterReservationDetailsRender = self.afterReservationDetailsRender
    self.afterReservationDetailsRender = () => {
        // console.log('afterReservationDetailsRender', self)
        self.old_afterReservationDetailsRender()

        let popover = self.popoverContent[0]
        let $popover = $(popover)
        let event = $popover.data('event')
        // console.log('event', event)
        if (event !== undefined && !is_single_reservation(event)) {
            // console.log('afterReservationDetailsRender :: not a single_reservation, event, ignoring', event)
            return
        }

        let ann_sf = $(popover_annotation(self)).data('bs.smartform')
        ann_sf.get_custom_data = () => {
            let user_entries = self.custom_input.state.user_entries
            return user_entries ? {users: user_entries} : null
        }
        // console.log('form', ann_sf)

        // let $custom_input = $(popover).find('.custom-wrapper')
        // this.init_state($custom_input)
        // this.init($custom_input)
        // this.update($custom_input)

    }

    return self
}




if (calendar.old_feedReservationCache === undefined) {
    calendar.old_feedReservationCache = calendar.feedReservationCache
}

calendar.feedReservationCache = function(data) {
    console.log('calendar.feedReservationCache', `${typeof data}: length ${data.length}`)
    // PATCH
    // if the user was logged out, api calls will redirect them to the login page
    // and data will end up being that page's HTML.
    // unfortunately, calendar.fetchReservations does no validation at all, so it gets through.
    if (typeof data === "string") {
        // error - needs relog
        messages.appendMessage(Message.createMessage('Wymagane ponowne zalogowanie. Odśwież stronę', 'critical'), true);
        return
    }
    return calendar.old_feedReservationCache(
        data.map((event) => {
            // watch out! freshly created events (i.e. the wizard is still open) don't have an id yet
            event.price_info_promise = fetch_event_price_info(event.id)
            return event
        })
    )
}




if (ReservationEvent.prototype.old_collectAnnotations === undefined) {
    ReservationEvent.prototype.old_collectAnnotations = ReservationEvent.prototype.collectAnnotations
}

ReservationEvent.prototype.collectAnnotations = function() {
    let annotations = this.old_collectAnnotations()
    return annotations.map((ann) =>
        (ann.type === 'unit') ?
            (ann.annotation = get_annotation_text(ann.annotation), ann) :
            ann
    )
};


count_cards = (ann_data) => {
    if (ann_data) {
        return ann_data.users.filter((e)=>e.card).length
    }
    return null
}


$(document).ready(() => {
    const bootstrap = {
        success: 'rgb(40, 167, 69)', // green
        primary: 'rgb(0,123,255)', // blue
    }
    let head = $('head')
    head.append($('<style id="card-info-badge-styles"></style>').text(`
        .badge.card-info-badge { padding: 2px 5px; }
        .badge.card-info-badge.loading   { background-color: gray;                 opacity: 0.3; }
        .badge.card-info-badge.guessed   {                                         opacity: 0.6; }
        .badge.card-info-badge.missing   { background-color: ${bootstrap.primary};               }
        .badge.card-info-badge.fulfilled { background-color: gray;                 opacity: 0.3; }
        .badge.card-info-badge.extra     { background-color: ${bootstrap.success};               }
        .badge.card-info-badge.error     { background-color: gray;                 opacity: 0.5; }
    `))
    // rgba(16, 76, 219, 0.9) // teal
    // rgba(43, 25, 250, 0.7) // purple
    let c = 'rgba(30, 54, 250, 0.85)' // deep purplish blue
    head.append($('<style id="custom-styles"></style>').text(`
        .rsv-unpaid.rsv-has-carnet {
            box-shadow: inset 0px 5px 0px 0px ${c} !important;
        }
    `))

})


/*
badge:
    loading {}
    ready   {used: int, required: int, paid: bool}
    error   {msg: str}
*/


card_count_badge_state = ({used_cards_num, price_list_id, carnets, is_paid}) => {
    const venue_price_info = VENUE_PRICE_INFO[venue.id]
    let price_info = venue_price_info.prices[price_list_id]
    if (price_info === undefined) {
        return {type: 'error', msg: `Unknown price (price_list_id: ${price_list_id})`}
    } else {
        let required_cards_num
        if (is_paid || (!is_paid && carnets === null)) {
            required_cards_num = price_info.cards
        } else { // !is_paid && carnets !== null 
            let carnet_type = Object.values(carnets)[0].type
            let carnet_price_info = venue_price_info.carnets[carnet_type]
            if (carnet_price_info === undefined) {
                return {type: 'error', msg: `Unknown carnet (carnet_type: ${carnet_type})`}
            }
            required_cards_num = carnet_price_info.cards
        }
        return {type: 'ready', used: used_cards_num, required: required_cards_num, paid: is_paid}
    }  
}

card_count_badge_render = (state) => {
    const make_badge = () => $(`<span class="card-info-badge badge badge-pill"></span>`)
    let badge
    if (state.type === 'loading') {
        badge = make_badge()
        badge .append(spinner_small()) .addClass('loading')

    } else if (state.type === 'ready') {
        let {used, required, paid} = state
        if (required === 0 && used === 0) {
            return $(null)
        }
        badge = make_badge()
        if (used > required) {
            badge .text(`${used - required}`) .addClass('extra')
        } else if (used < required) {
            badge .text(`${required - used}`) .addClass('missing')
        } else {
            badge .text('✓') .addClass('fulfilled')
        }
        if (!paid) { badge .addClass('guessed') }

    } else if (state.type === 'error') {
        let {msg} = state
        badge = make_badge()
        badge .text('×') .addClass('error') //.tooltip({title: msg, container: 'body'})
    }

    return badge
}

spinner_small = () => {
    let spinner = ich.spinner().css({width: '10px'})
    spinner.find('img').css({maxWidth: '100%'})
    return spinner
}

html_entities_decode = (s) => $("<div>").html(s).text()

fetch_event_price_info = (id) => (
    $.ajax({
        url: urlReverse('event_details'), data: { id: id },
        dataType: "json",
    }).then((data) => {
        let price_list_id = (data.html.match(/data-price-list-id="(\d+)"/) || [null, null])[1]
        price_list_id = (price_list_id !== null && price_list_id !== "") ? Number(price_list_id) : null
        let carnet_raw = (data.html.match(/data-carnets="(.+?)"/) || [null, null])[1]
        let carnets = (carnet_raw !== null && carnet_raw !== '{}')
            ? JSON.parse(html_entities_decode(carnet_raw))
            : null
        if (carnets === null) {
            return {price_list_id: price_list_id, carnets: carnets}
        } else {
            let client_id = (data.html.match(/\/clients\/c\/(\d+)\//) || [null, null])[1]
            if (client_id === null) { throw new Error(`no client id found for event ${id}`) }
            // client_id = Number(client_id)
            let reqs = Object.entries(carnets).map(([carnet_id, carnet]) => {
                return $.ajax({
                    type: 'GET', url: `/clients/carnet/create/${client_id}/`, dataType: 'json',
                    data: {carnet: carnet_id},
                }).then((data) => {
                    let carnet_type = (data.html.match(/<option value="(\d+)" price="[^"]+" days="[^"]+" resources="[^"]+" selected="selected">/) || [null, null])[1]
                    if (carnet_type === null) { throw new Error(`no carnet type found for user ${client_id}, carnet ${carnet_id}`) }
                    carnet.type = Number(carnet_type)
                    return [carnet_id, carnet]
                })
            })
            return $.when(...reqs).then((...new_carnets) => (
                {price_list_id: price_list_id, carnets: Object.fromEntries(new_carnets)}
            ))
        }
    })
)

if (BaseReservationEvent.prototype.old_render === undefined) {
    BaseReservationEvent.prototype.old_render = BaseReservationEvent.prototype.render
}

BaseReservationEvent.prototype.render = function(event, element) {
    // console.log('BaseReservationEvent.render', this, event, element)
    this.old_render(event, element)

    if (event !== undefined && !is_single_reservation(event)) {
        // console.log('BaseReservationEvent.render :: not a single_reservation, ignoring', event)
        return
    }
    if (ReservationStub.prototype.isPrototypeOf(event) || event.className.includes('rsv-stub')) {
        // reservation is being created
        return
    }


    let title = this.element.find('.fc-event-title')
    let title_text = title.find('div')
    title.css({display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'})
    title_text.css({marginLeft: 'auto', marginRight: 'auto'})


    let annotation = this.event.annotation
    let is_paid = this.event.className.includes('rsv-paid')

    let ann_data = annotation ? get_annotation_data(annotation) : {users: []}
    let used_cards_num = count_cards(ann_data) || 0

    // should only happen in development, during reloading
    if (event.price_info_promise === undefined) {
        event.price_info_promise = fetch_event_price_info(event.id)
    }
    let pending_badge = (event.price_info_promise.isResolved)
        ? $('<span></span>')
        : card_count_badge_render({type: 'loading'})
    title.append(pending_badge)

    event.price_info_promise.then((info) => {
        console.log('fetched price info for', event.id, $(event.title).text(), '->', info)
        let badge_state = card_count_badge_state({
            used_cards_num: used_cards_num,
            is_paid: is_paid,
            price_list_id: info.price_list_id,
            carnets: info.carnets
        })
        let badge = card_count_badge_render(badge_state)
        pending_badge.replaceWith(badge)
        if (info.carnets !== null) {
            element.addClass('rsv-has-carnet')
        }
    })
}





$.widget("custom.userProfileAutocomplete2", $.custom.userProfileAutocomplete, {
    _renderMenu: function(ul, items) {
        if (this.options.showAddClient) {
            items.push({is_add_new_client: null, label: '', value: ''})
        }
        ul.addClass('user-profile-autocomplete-menu');
        $.ui.autocomplete.prototype._renderMenu.call(this, ul, items);
    },
    _renderItem: function(ul, item) {
        if (this.options.showAddClient && 'is_add_new_client' in item) {
            let el = ich.autocompleteAddNewClient()
            ul.append(el);
            return el
        } else {
            return $.ui.autocomplete.prototype._renderItem.call(this, ul, item)
        }
    },
});


VENUE_PRICE_INFO = {
    80: {
        "name": "SquashCity Jerozolimskie 200",
        "class_prices": {
            benefit: 1646,
        },
        "price_default": 1707,
        "prices": {
            null: {"cards": 0, "name": "Własna cena"},
            1707: {"cards": 0, "name": "Cennik Standardowy"},
            1708: {"cards": 1, "name": "Mam 1 Kartę MultiSport Plus/FitProfit/OK System"},
            1709: {"cards": 2, "name": "Mam 2 Karty MultiSport Plus/FitProfit/OK System"},
            1710: {"cards": 1, "name": "Mam 1 Kartę OK System Gold"},
            1711: {"cards": 0, "name": "Karnet 5h"},
            1713: {"cards": 1, "name": "Karnet 5h - 1 karta zniżkowa"},
            1712: {"cards": 0, "name": "Karnet 10h"},
            1714: {"cards": 1, "name": "Karnet 10h - 1 karta zniżkowa"},
            1936: {"cards": 2, "name": "Karnet 10h - 2 karty zniżkowe"},
            1757: {"cards": 0, "name": "Juniorzy, Studenci (<26l) - 1h"},
            1758: {"cards": 1, "name": "Juniorzy, Studenci (<26l) - 1 karta zniżkowa"},
            1759: {"cards": 2, "name": "Juniorzy, Studenci (<26l) - 2 karty zniżkowe"},
            1760: {"cards": 0, "name": "Open Juniorzy, Studenci (<26 l)  - karnet 5h"},
            1762: {"cards": 1, "name": "Open Juniorzy, Studenci (<26 l)  - karnet 5h - jedna karta zniżkowa"},
            1761: {"cards": 0, "name": "Open Juniorzy, Studenci (<26 l)  - karnet 10h"},
            1763: {"cards": 1, "name": "Open Juniorzy, Studenci (<26 l)  - karnet 10h - jedna karta zniżkowa"},
            1754: {"cards": 0, "name": "Decathlon - cena hurtowa"},
            1755: {"cards": 0, "name": "Sekcja - cena hurtowa"},
            1756: {"cards": 0, "name": "Liga - cena hurtowa"},
            1918: {"cards": 0, "name": "Cennik trenerski"},
            3107: {"cards": 0, "name": "DoRozliczenia"},
            2380: {"cards": 0, "name": "__Goodie z kodem"},
        },
        "carnets": {
            355: {"cards": 0, "name": "Karnet OPEN 5h, pn-pt 9-17"},
            356: {"cards": 0, "name": "Karnet OPEN 5h, pn-pt 17-23"},
            357: {"cards": 0, "name": "Karnet OPEN 5h, sb-nd"},
            358: {"cards": 0, "name": "Karnet OPEN 10h, pn-pt 9-17"},
            359: {"cards": 0, "name": "Karnet OPEN 10h, pn-pt 17-23"},
            360: {"cards": 0, "name": "Karnet OPEN 10h, sb-nd"},
            361: {"cards": 1, "name": "Karnet OPEN 5h, pn-pt 9-17 + 1 karta zniżkowa"},
            362: {"cards": 1, "name": "Karnet OPEN 5h, pn-pt 17-23 + 1 karta zniżkowa"},
            363: {"cards": 1, "name": "Karnet OPEN 5h, sb-nd + 1 karta zniżkowa"},
            364: {"cards": 1, "name": "Karnet OPEN 10h, pn-pt 9-17 + 1 karta zniżkowa"},
            365: {"cards": 1, "name": "Karnet OPEN 10h, pn-pt 17-23 + 1 karta zniżkowa "},
            366: {"cards": 1, "name": "Karnet OPEN 10h, sb-nd + 1 karta zniżkowa"},
            376: {"cards": 0, "name": "Karnet JUNIOR OPEN 5h, pn-pt 9-16"},
            476: {"cards": 0, "name": "Karnet OPEN 5h, pn-pt 7-9"},
            477: {"cards": 1, "name": "Karnet OPEN 5h, pn-pt 7-9 + 1 karta zniżkowa"},
            478: {"cards": 1, "name": "Karnet OPEN 10h, pn-pt 7-9 + 1 karta zniżkowa"},
            479: {"cards": 0, "name": "Karnet OPEN 10h, pn-pt 7-9"},
            480: {"cards": 1, "name": "Karnet JUNIOR OPEN 5h, pn-pt 9-16 + 1 karta zniżkowa"},
            481: {"cards": 1, "name": "Karnet JUNIOR OPEN 10h, pn-pt 9-16 + 1 karta zniżkowa"},
            482: {"cards": 0, "name": "Karnet JUNIOR OPEN 10h, pn-pt 9-16"},
            501: {"cards": 2, "name": "Karnet OPEN 10h, sb-nd + 2 karty zniżkowe"},
            502: {"cards": 2, "name": "Karnet OPEN 10h, pn-pt 7-9 + 2 karty zniżkowe"},
            503: {"cards": 2, "name": "Karnet OPEN 10h, pn-pt 17-23 + 2 karty zniżkowe"},
            504: {"cards": 2, "name": "Karnet OPEN 10h, pn-pt 9-17 + 2 karty zniżkowe"},
        },
    },
    82: {
        "name": "SquashCity Targówek",
        "class_prices": {
            benefit: 1646,
        },
        "price_default": 1540,
        "prices": {
            null: {"cards": 0, "name": "Własna cena"},
            1540: {"cards": 0, "name": "Standardowy"},
            1541: {"cards": 0, "name": "Juniorzy, Studenci (<26l) - 1h"},
            1542: {"cards": 1, "name": "1 karta Multisport Plus/FitProfit/OK System"},
            1543: {"cards": 2, "name": "2 karty Multisport Plus/FitProfit/OK System"},
            1547: {"cards": 0, "name": "Karnet 5h"},
            1539: {"cards": 1, "name": "Karnet 5h - 1 karta zniżkowa"},
            1959: {"cards": 0, "name": "Karnet 10h"},
            1960: {"cards": 1, "name": "Karnet 10h - 1 karta zniżkowa"},
            1961: {"cards": 2, "name": "Karnet 10h - 2 Karty zniżkowe"},
            2961: {"cards": 0, "name": "Karnet Liga"},
            3108: {"cards": 0, "name": "DoRozliczenia"},
            1617: {"cards": 0, "name": "Cennik trenerski"},
            2984: {"cards": 0, "name": "Korty dla Pań 25 zł (28-29.09.19)"},
            2985: {"cards": 1, "name": "Korty dla Pań z kartą zniżkową (28-29.09.19)"},
            2986: {"cards": 0, "name": "Korty dla Pań 50% taniej (27.09.19)"},
            2987: {"cards": 1, "name": "Korty dla Pań 50% taniej z kartą zniżkową  (27.09.19)"},
            1546: {"cards": 0, "name": "XXX - do usunięcia: 7:00 - 17:00"},
            1548: {"cards": 0, "name": "XXX - do usunięcia: weekend 9:00 - 22:00"},
            1549: {"cards": 0, "name": "STARE: 1 wejście, OPEN"},
            1572: {"cards": 0, "name": "STARE: Zgrana paka, 1 wejście (pon-czw)"},
        },
        "carnets": {
            380: {"cards": 0, "name": "Carnet OPEN 10h, pn-pt 7-17"},
            381: {"cards": 0, "name": "Carnet OPEN 10h, pn-pt 17-23"},
            382: {"cards": 0, "name": "Carnet OPEN 10h, sb-nd"},
            391: {"cards": 1, "name": "Carnet OPEN 10h, pn-pt 7-17 + 1 Karta zniżkowa"},
            392: {"cards": 1, "name": "Carnet OPEN 10h, pn-pt 17-23 + 1 Karta zniżkowa"},
            393: {"cards": 1, "name": "Carnet OPEN 10h, sb-nd  + 1 Karta zniżkowa"},
            394: {"cards": 2, "name": "Carnet OPEN 10h, pn-pt 17-23 + 2 Karty zniżkowe"},
            395: {"cards": 2, "name": "Carnet OPEN 10h, sb-nd + 2 Karty zniżkowe"},
            377: {"cards": 0, "name": "Carnet OPEN 5h, pn-pt 7-17"},
            378: {"cards": 0, "name": "Carnet OPEN 5h, pn-pt 17-23"},
            379: {"cards": 0, "name": "Carnet OPEN 5h, sb-nd"},
            385: {"cards": 1, "name": "Carnet OPEN 5h, pn-pt 7-17 + 1 Karta zniżkowa"},
            386: {"cards": 1, "name": "Carnet OPEN 5h, pn-pt 17-23 + 1 Karta zniżkowa"},
            387: {"cards": 1, "name": "Carnet OPEN 5h, sb-nd + 1 Karta zniżkowa"},
            398: {"cards": 0, "name": "Carnet JUNIOR OPEN 10h, pn-pt 7-16"},
            397: {"cards": 1, "name": "Carnet JUNIOR OPEN 10h, pn-pt 7-16 + 1 Karta zniżkowa"},
            384: {"cards": 0, "name": "Carnet JUNIOR OPEN 5h"},
            383: {"cards": 0, "name": "Carnet JUNIOR OPEN 5h, pn-pt 7-16"},
            396: {"cards": 1, "name": "Carnet JUNIOR OPEN 5h, pn-pt 7-16 + 1 Karta zniżkowa"},
            306: {"cards": 0, "name": "Carnet OPEN 10h"},
            325: {"cards": 0, "name": "Carnet  Zgrana Paka - Weekend"},
            326: {"cards": 0, "name": "Carnet Zgrana paka"},
        },
    },
}



_refreshPopovers()
// calendar.updateFullcalendar()
calendar.fetchReservations()
calendar.HAS_ADD_CLIENTS = true




parse_class_reservation = (modal) => {
    const parse_client = (el) => {
        // sorry, the html is really ugly
        // console.log(el)
        let res = {}
        res['reservation_id'] = null
        res['status'] = (
            el.hasClass('rsv-active'   ) ? 'active'    : 
            el.hasClass('rsv-cancelled') ? 'cancelled' :
            null 
        )
        try {
            let x = el.find('.panel-title .row').first().find('.col-lg-3')
            // console.log(x)
            let [_cancel, client, price, _presence] = x.toArray().map($)
            let [collapse, client2] = client.find('a').toArray().map($)
            res['client_name'] = (collapse.text())
            res['client_id'] = client2.attr('href').match(/\/clients\/c\/(\d+)\//)[1]
            res['reservation_id'] = collapse.attr('href').match(/#event-reservation-collapse-(\d+)/)[1]
            let price2 = price.find('.price').first()
            // console.log('price', $.trim(price.text()), price)
            // console.log('price2', price2.text(), price2)
            res['reservation_price'] = (
                // standard -> `price` is an empty div
                // cancelled -> `price` contains something like "reservation cancelled" 
                (price2.length === 0)            ? ($.trim(price.text()) ? null : 'standard') :
                (price2.text().search(/-15[,.]00/) !== -1) ? 'multisport' : 
                (price2.text().search(/-20[,.]00/) !== -1) ? 'ok_gold'    : 
                null
            )
            // console.log(res['reservation_price'])
            // console.log()
        } catch (e) {
            console.log(e)
        }
        return res 
    }
    return modal.find('.fitnessPanel').toArray().map((el)=>parse_client($(el)))
}

class_event_reservations = (event_id) => {
    return class_event_reservations_raw(event_id).then((text) => parse_class_reservation($(text)))
}


class_event_reservations_raw = (event_id) => {
    return $.get(`https://reservise.com/events/class_event_reservations_list/${event_id}`)
}


group_by = (xs, f) => {
    let g = {}
    for (let x of xs) {
        let fx = f(x)
        if (!(fx in g)) {
            g[fx] = []
        }
        g[fx].push(x)
    }
    return g
}

// existing_num = Object.fromEntries(Object.entries(existing_by_client).map(([c,rs])=>[c,rs.length]))
// ann_num = Object.fromEntries(Object.entries(ann_ms_by_client).map(([c,rs])=>[c,rs.length]))
// x = []
// for (let [c, n] of Object.entries(existing_num)) {
//     let na = ann_num[c] || 0
//     if (na != n) {
//         for(let i=0; i<n - na; i++) {
//             x.push(existing_by_client[c][0].client_name)
//         }
//     }
// }
// x.sort()

async function sync_benefit(dry_run=true) {
    let benefit_res_id = get_benefit_reservation().id
    let existing = (await class_event_reservations(benefit_res_id)) .filter((r) => r.status === 'active')
    console.log('before', existing)
    // return
    let existing_by_client = group_by(existing, (r)=>r.client_id)
    let ann_ms = Object.values(calendar.reservationsById)
                    .filter((r) => r !== undefined && r.event !== undefined && calendar.date.isSame(r.event.start, 'day'))
                    .map((r) => get_annotation_data(r.event.annotation))
                    .filter((d) => d!==null && d.users.length>0)
                    .flatMap((d) =>d.users)
                    .filter((e) => e.card)
    console.log('from annotations', ann_ms)
    // return
    let ann_ms_by_client = group_by(ann_ms, (en)=>en.user.id)
    for (let [client_id, entries] of Object.entries(ann_ms_by_client)) {
        let existing_reservations = existing_by_client[client_id] || []
        let diff = entries.length - existing_reservations.length
        let client_name = entries[0].user.label
        console.log(client_id, client_name, 'needs', diff)
        if (dry_run) { continue }
        for (let i = 0; i < diff; i++) {
            console.log('adding', client_name, entries[0].user.label)
            let res = await add_benefit_reservation(client_id, benefit_res_id)
            console.log(res)
            if (res.success === undefined || !res.success) {
                console.log('aborting')
                return
            }
        }
    }
}

// let KTOS_KTOS = 687826

add_benefit_reservation = (client_id, benefit_res_id=null) => {
    benefit_res_id = (benefit_res_id === null) ? get_benefit_reservation().id : benefit_res_id
    let add_client_url = `/events/create_class_reservation/?event_id=${benefit_res_id}`
    return $.ajax({type: 'GET', url: add_client_url, dataType: 'json', }).then((data) => {
        let csrf = (data.html.match(/<input type='hidden' name='csrfmiddlewaretoken' value='(.+?)'/) || [null, null])[1]
        if (!csrf) {
            throw new Error('no csrf token found' + JSON.stringify(data))
        }
        return $.ajax({type: 'POST', url: '/events/create_class_reservation/',  dataType: 'json', data: {
            csrfmiddlewaretoken: csrf,
            event_id: benefit_res_id,
            user_profile: client_id,
            price_list: '15.00;'+VENUE_PRICE_INFO[venue.id].class_prices.benefit,
            value: '15.00',
            last_name: '',
            first_name: '',
            phone_number: '',
            email: '',
            annotation: '',
            create_new_client: '',
        }})
    })
}

// await add_benefit_reservation(KTOS_KTOS).then((res)=>calendar.reservationsUpdated(res.updatedReservations))
