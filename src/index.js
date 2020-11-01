// 2020.03.05-r1
import { uniqBy, noop } from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import { GameResults } from './game-results-widget'

import {
    is_nonempty,
    is_instance_of,
    group_by,
} from './utils'

import { AddClient, style as addClientStyle } from './add-client-widget'
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
        const popover  = self.popoverContent[0]
        const $popover = $(popover)
        // self.selected_price = $popover.find('[data-price-list-id]').attr('data-price-list-id')
        const event = $popover.data('event')
        if (event !== undefined && !is_single_reservation(event)) {
            // console.log('createPopoverContentFromResponse :: not a single_reservation, ignoring', event)
            return
        }


        const $ann_tag = $(get_event_details_uninited_annotation_node(popover))
        let [ann_text, ann_data] = annotations.parse($ann_tag.val())
        $ann_tag.val(ann_text)

        const reservation_owner = reservation_owner_from_popover($popover)

        ann_data = ann_data || {}
        let {users: user_entries = [], game_results = []} = ann_data

        self.get_custom_data = () => ({user_entries})

        const $tab_content = $popover.children('.tab-content')

        // CLIENT INPUT
        
        const $client_input = $('<div>')
        const $results_input = $('<div>')
        $tab_content.before($client_input)
        $tab_content.before($results_input)

        const render_react_inputs = () => {
            ReactDOM.render(
                <AddClient
                    user_entries={user_entries}
                    reservation_owner={reservation_owner}
                    onChange={(new_user_entries) => {
                        user_entries = new_user_entries
                        console.info('rerendering AddClient', user_entries)
                        setTimeout(render_react_inputs, 0)
                        // write_popover_data(self, is_nonempty(new_user_entries) ? {...ann_data, users: new_user_entries} : null)
                    }}
                />,
                $client_input[0]
            )

            ReactDOM.render(
                <GameResults
                    game_results={game_results}
                    users={uniqBy([reservation_owner, ...user_entries.map(({user}) => ({...user, id: parseInt(user.id)}))], 'id')}
                    onChange={(new_results) => {
                        game_results = new_results
                        setTimeout(render_react_inputs, 0)
                    }}
                />,
                $results_input[0]
            )
        }

        render_react_inputs()



        // see inject_custom_data(...) above for explanation
        const $ann_form = $ann_tag.closest('form')
        const $save_ann = $ann_form.find('[type="submit"]')
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
            let {user_entries} = self.get_custom_data()
            return is_nonempty(user_entries) ? {users: user_entries} : null
        }
    }

    return self
}

const get_event_details_uninited_annotation_node = (event_details) => {
    return event_details.querySelector('[name="annotation"]')
}



const reservation_owner_from_popover = ($popover) => {
    /*
    Assumed html structure:

    <div class="event-details">
        ...
        <div class="detailsHeader clearfix">
            <div class="divWrapper setPaddingLR setPaddingTB">
                <div class="left-div">
                    <span class="h5">
                        <a href="/clients/c/244335/" target="_blank">
                            Nawrocki Adam
                        </a>
                    </span>
                    <i class="glyphicon glyphicon-phone" data-toggle="tooltip" title="" data-original-title="+48602139969"> </i>
                    <a href="mailto:a.nawros@gmail.com" target="_top">
                        <i class="glyphicon glyphicon-envelope" data-toggle="tooltip" title="" data-original-title="a.nawros@gmail.com"></i>
                    </a>
                </div>
                ...
            </div>
        </div>
        ...
    </div>
    */

    const [link] = $popover.find('.detailsHeader a[href^="/clients/c/"]').toArray()
    if (!link) { return null }
    const [, str_id = null] = link.href.match(/\/clients\/c\/(\d+)\//)
    if (str_id === null) { return null }
    const id = parseInt(str_id)
    if (isNaN(id)) { return null }

    let label = link.innerText.trim()

    const [phone_icon] = $popover.find('.detailsHeader .glyphicon-phone').toArray()
    if (phone_icon) {
        const phone = phone_icon.getAttribute('title') || phone_icon.getAttribute('data-original-title')
        if (phone) {
            label += ` (${phone})`
        }
    }

    return {id, label}
}


const add_card_list = () => {
    const today = window.calendar.date
    const user_entries_with_card = (
        Object.values(window.calendar.reservationsById)
            .filter((r) =>
                r !== undefined &&
                r.event !== undefined
                && today.isSame(r.event.start, 'day'))
            .sort((ra, rb) => rb.event.start.diff(ra.event.start))
            .flatMap((r) => {
                const event_id = r.event.id
                const data = annotations.get_data(r.event.annotation)
                if (!data) { return [] }
                return (data.users
                    .filter((entry) => entry.card)
                    .map((entry) => ({...entry, event_id}))
                )
            })
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
        className: 'sidebar-section',
        on_show_reservation: (event_id) => window.calendar.reservationsById[event_id].showDetailsPopover(),
        on_sync_cards: async () => {
            const result = await sync_card_annotations_with_reservation({
                user_entries: user_entries_with_card,
                dry_run: false
            })
            if (result.success) {
                const {num_added} = result
                ui.show_success(`Dodano ${num_added} kart zniżkowych`)
            } else {
                const {num_added, reason = ''} = result
                ui.show_error(`Problem z synchronizacją kart zniżkowych: ${reason} (dodano ${num_added})`)
            }
            ui.refetch_reservations()
        },
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
    }).catch((err) => {
        const msg = (
            typeof err === 'object' && err.message !== undefined
                ? err.message
                : 'Unknown error'
        )
        console.error('Error fetching price info for event', event, err)
        ui.show_error(msg)
    })
}


const count_cards = (ann_data) => {
    if (ann_data) {
        return ann_data.users.filter((e)=>e.card).length
    }
    return null
}





export async function sync_card_annotations_with_reservation({user_entries, dry_run = true}) {
    const benefit_res = ui.get_current_benefit_reservation()
    console.log('benefit reservation', benefit_res)
    if (!benefit_res) {
        return {success: false, num_added: 0, reason: 'Nie znaleziono zajęć grupowych o nazwie "Karty zniżkowe"'}
    }
    const benefit_res_id = benefit_res.id
    const existing = (await api.class_event_reservations(benefit_res_id)).filter((r) => r.status === 'active')
    console.log('existing', existing)
    console.log('from annotations', user_entries)

    const existing_by_client = group_by(existing, (r)=>r.client_id)
    const ann_ms_by_client = group_by(user_entries, (en)=>en.user.id)

    let num_added = 0
    for (const [client_id, entries] of Object.entries(ann_ms_by_client)) {
        const existing_reservations = existing_by_client[client_id] || []
        const diff = entries.length - existing_reservations.length
        const client_name = entries[0].user.label
        console.log(client_id, client_name, 'needs', diff)
        if (dry_run) { continue }
        for (let i = 0; i < diff; i++) {
            console.log('adding', client_name, entries[0].user.label)
            const res = await ui.add_benefit_reservation({client_id, benefit_res_id})
            console.log(res)
            const { success = false } = res
            if (!success) {
                return {
                    success: false,
                    num_added,
                    reason: (
                        `Nie udało się dodać klienta '${client_name} (id: '${client_id})`+
                        ` do listy kart zniżkowych (id: ${benefit_res_id})`
                )}
            }
            num_added += 1
        }
    }
    return {success: true, num_added}
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
    head.append($('<style id="add-client-styles">').text(AddClient.style))

    ui.refresh_popovers()
    // window.calendar.updateFullcalendar()
    window.calendar.fetchReservations()
    window.calendar.HAS_ADD_CLIENTS = true
    $('#tasks-wrapper').before('<div id="card-list-wrapper">')
    add_card_list()
})