// 2020.03.05-r1

import {
    is_nonempty,
    is_instance_of,
    group_by,
} from './utils'

import { AddClientWidget } from './add-client-widget'
import * as card_count_badge from './card-count-badge'
import * as api from './reservise-api'
import * as ui from './reservise-ui'
import { VENUE_PRICE_INFO } from './price-info'
import * as annotations from './annotations'

import { CardList } from './card-list'
import * as card_list from './card-list'


const popover_annotation_node = (popover) => {
    let event_details = popover.popoverContent[0] // .event-details
    // let event_ann = event_details.querySelector('#popoverReservationAnnotation').children[0].querySelector('.smartform-enabled, .smartform-disabled, .smartform-static')
    let ann_wrapper = event_details.querySelector('#popoverReservationAnnotation li:not(.custom-wrapper)')
    return ann_wrapper.querySelector('.smartform-enabled, .smartform-disabled, .smartform-static')
}

const modify_popover_annotation = (popover, f) => {
    let ann = popover_annotation_node(popover)
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

const get_popover_annotation = (popover) => {
    let ann = popover_annotation_node(popover)
    // console.log('popover annotation', ann)
    let $ann = $(ann)
    let ann_sf = $ann.data('bs.smartform')
    ann_sf.enable()
    let val = ann_sf.inputElements().val()
    ann_sf.makestatic()
    return val
}

const write_popover_data = (popover, data) => {
    let old_ann = get_popover_annotation(popover)
    let ann_text = annotations.get_text(old_ann)
    let new_ann = annotations.serialize(ann_text, data)
    modify_popover_annotation(popover, (_)=>new_ann)
}



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
        let ann_text = annotations.get_text(ann)
        let new_ann = annotations.serialize(ann_text, data)
        console.log('new annotation', new_ann)
        return new_ann
    })
    // this.inputElements().val(new_ann)
}


const is_class_reservation  = (event) => event.client_list_url !== undefined
const is_unavailability     = (event) => event.className.includes('unavailability')
const is_single_reservation = (event) => !is_class_reservation(event) && !is_unavailability(event)



const ORIGINAL = {
    ReservationDetailsPopover: window.ReservationDetailsPopover,
    // uses closed-over window.calendar instead of `this`
    calendar_feedReservationCache: window.calendar.feedReservationCache,
    calendar_updateFullcalendar: window.calendar.updateFullcalendar,
    calendar_reservationsUpdated: window.calendar.reservationsUpdated,
    ReservationEvent: {
        collectAnnotations: window.ReservationEvent.prototype.collectAnnotations,
    },
    BaseReservationEvent: {
        render: window.BaseReservationEvent.prototype.render,
    },
}



window.ReservationDetailsPopover = function (event_id, refetch_func, attachment_func) {
    console.log('intercepted!', event_id)
    const self = new ORIGINAL.ReservationDetailsPopover(event_id, refetch_func, attachment_func);
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


        let $ann_tag = $(get_event_details_uninited_annotation_node(popover))
        let [ann_text, ann_data] = annotations.parse($ann_tag.val())
        $ann_tag.val(ann_text)

        ann_data = ann_data || {}
        let user_entries = ann_data.users || []
        self.custom_input = new AddClientWidget(user_entries, {
            on_user_entries_change: (new_user_entries) => (
                write_popover_data(self, is_nonempty(new_user_entries) ? {users: new_user_entries} : null)
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

        let ann_sf = $(popover_annotation_node(self)).data('bs.smartform')
        ann_sf.get_custom_data = () => {
            let user_entries = self.custom_input.state.user_entries
            return is_nonempty(user_entries) ? {users: user_entries} : null
        }
        // console.log('form', ann_sf)

        // let $custom_input = $(popover).find('.custom-wrapper')
        // this.init_state($custom_input)
        // this.init($custom_input)
        // this.update($custom_input)

    }

    return self
}

const get_event_details_uninited_annotation_node = (event_details) => {
    return event_details.querySelector('[name="annotation"]')
}




const add_card_list = () => {
    const today = window.calendar.date
    const user_entries_with_card = (
        Object.values(window.calendar.reservationsById)
            .filter((r) =>
                r !== undefined &&
                r.event !== undefined
                && today.isSame(r.event.start, 'day'))
            .map((r) => annotations.get_data(r.event.annotation))
            .filter((d) => d!==null && d.users.length>0)
            .flatMap((d) =>d.users)
            .filter((e) => e.card)
    )

    const card_list_wrapper = $('#card-list-wrapper')
    const old_card_list = card_list_wrapper.children('.card-list')
    const attach = (
        old_card_list.length > 0
            ? (el) => old_card_list.replaceWith(el)
            : (el) => card_list_wrapper.append(el)
    )
    const new_card_list = CardList({
        user_entries: user_entries_with_card,
        className: 'sidebar-section'
    })
    card_list.sync({old: old_card_list, new: new_card_list})
    attach(new_card_list)
}

window.calendar.feedReservationCache = function(data) {
    console.log(
        'window.calendar.feedReservationCache',
        data ? `${data.constructor.name}, length ${data.length}` : `${data}`
    )
    // PATCH
    // if the user was logged out, api calls will redirect them to the login page
    // and data will end up being that page's HTML.
    // unfortunately, window.calendar.fetchReservations does no validation at all, so it gets through.
    if (typeof data === "string") {
        // error - needs relog
        ui.show_critical_error('Wymagane ponowne zalogowanie. Odśwież stronę');
        return
    }

    return ORIGINAL.calendar_feedReservationCache(
        data.map((event) => {
            // watch out! freshly created events (i.e. the wizard is still open) don't have an id yet
            event.price_info_promise = api.fetch_event_price_info(event.id)
            return event
        })
    )
}

window.calendar.updateFullcalendar = function(...args) {
    console.log('updateFullcalendar')
    const res = ORIGINAL.calendar_updateFullcalendar(...args)
    add_card_list()
    return res
}

window.calendar.reservationsUpdated = function(...args) {
    console.log('reservationsUpdated')
    const res = ORIGINAL.calendar_reservationsUpdated(...args)
    add_card_list()
    return res
}


window.ReservationEvent.prototype.collectAnnotations = function() {
    let anns = ORIGINAL.ReservationEvent.collectAnnotations.call(this)
    return anns.map((ann) =>
        (ann.type === 'unit')
            ? (ann.annotation = annotations.get_text(ann.annotation), ann)
            : ann
    )
};


window.BaseReservationEvent.prototype.render = function(event, element) {
    // console.log('BaseReservationEvent.render', this, event, element)
    ORIGINAL.BaseReservationEvent.render.call(this, event, element)

    if (event !== undefined && !is_single_reservation(event)) {
        // console.log('BaseReservationEvent.render :: not a single_reservation, ignoring', event)
        return
    }
    if (is_instance_of(event, window.ReservationStub) || event.className.includes('rsv-stub')) {
        // reservation is being created
        return
    }


    let title = this.element.find('.fc-event-title')
    let title_text = title.find('div')
    title.css({display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'})
    title_text.css({marginLeft: 'auto', marginRight: 'auto'})


    let annotation = this.event.annotation
    let is_paid = this.event.className.includes('rsv-paid')

    let ann_data = annotation ? annotations.get_data(annotation) : {users: []}
    let used_cards_num = count_cards(ann_data) || 0

    // should only happen in development, during reloading
    if (event.price_info_promise === undefined) {
        event.price_info_promise = api.fetch_event_price_info(event.id)
    }
    let pending_badge = card_count_badge.render({type: 'loading'})
    title.append(pending_badge)

    event.price_info_promise.then((info) => {
        // console.log('fetched price info for', event.id, $(event.title).text(), '->', info)
        let badge_state = card_count_badge.compute_state({
            used_cards_num: used_cards_num,
            is_paid: is_paid,
            price_list_id: info.price_list_id,
            carnets: info.carnets,
            venue_price_info: VENUE_PRICE_INFO[window.venue.id],
        })
        let badge = card_count_badge.render(badge_state)
        pending_badge.replaceWith(badge)
        if (info.carnets !== null) {
            element.addClass('rsv-has-carnet')
        }
    }).catch((err)=>ui.show_error(err.message))
}


const count_cards = (ann_data) => {
    if (ann_data) {
        return ann_data.users.filter((e)=>e.card).length
    }
    return null
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
            let el = window.ich.autocompleteAddNewClient()
            ul.append(el);
            return el
        } else {
            return $.ui.autocomplete.prototype._renderItem.call(this, ul, item)
        }
    },
});




export async function sync_benefit({dry_run = true}) {
    let benefit_res_id = ui.get_benefit_reservation().id
    let existing = (await api.class_event_reservations(benefit_res_id)) .filter((r) => r.status === 'active')
    console.log('before', existing)
    // return
    let existing_by_client = group_by(existing, (r)=>r.client_id)
    let ann_ms = Object.values(window.calendar.reservationsById)
                    .filter((r) => r !== undefined && r.event !== undefined && window.calendar.date.isSame(r.event.start, 'day'))
                    .map((r) => annotations.get_data(r.event.annotation))
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
            let res = await ui.add_benefit_reservation({client_id, benefit_res_id})
            console.log(res)
            if (res.success === undefined || !res.success) {
                console.log('aborting')
                return
            }
        }
    }
}


// add a blue bar over unpaid carnet reservations
const CARNET_UNPAID_CSS = `
.rsv-unpaid.rsv-has-carnet {
    box-shadow: inset 0px 5px 0px 0px rgba(30, 54, 250, 0.85) !important;
}
`

$(document).ready(() => {
    let head = $('head')
    head.append($('<style id="card-info-badge-styles">').text(card_count_badge.style))
    head.append($('<style id="custom-styles">').text(CARNET_UNPAID_CSS))
    head.append($('<style id="collapsible-styles">').text(card_list.style))

    ui.refresh_popovers()
    // window.calendar.updateFullcalendar()
    window.calendar.fetchReservations()
    window.calendar.HAS_ADD_CLIENTS = true
    $('#tasks-wrapper').before('<div id="card-list-wrapper">')
    add_card_list()
})