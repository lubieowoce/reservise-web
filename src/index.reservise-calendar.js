import React from 'react'
import ReactDOM from 'react-dom'

import {
    is_nonempty,
    is_instance_of,
    group_by,
} from './utils'

import * as card_count_badge from './card-count-badge'
import { scoreIndicator } from './score-indicator'
import * as api from './reservise-api'
import * as ui from './reservise-ui'
import { VENUE_PRICE_INFO } from './price-info'
import * as annotations from './annotations'

import { CardList } from './components/card-list'
import { MatchList } from './components/match-list'
import * as matchList from './components/match-list'

import { Provider } from 'react-redux'

import { ClientData } from './components/client-data-widget'


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


const patchSmartFormInput = ($annotationNode) => {
    let [annotationText, annotationData] = annotations.parse($annotationNode.val())
    $annotationNode.val(annotationText)

    // see inject_custom_data(...) above for explanation

    const $annotationFormNode = $annotationNode.closest('form')
    const $annotationSaveInput = $annotationFormNode.find('[type="submit"]')
    $annotationSaveInput.attr('smartform-action', "inject_custom_data")

    return annotationData
}


// Smartform action callback.
// Called when an element
//    <input smartforms-action="inject_custom_data">
// is clicked.
// (see SmartForm.setHandlers and SmartForm.handleActionClick)

// when the user edits and saves the annotation,
// we need to reinject the extracted data.
// otherwise, all the custom data would be lost!

// IDEA: SmartForm.transitionTo(new_state) calls this[old_state+"2"+new_state]
// we could use this to inject some code to extract the stored data during init!

// $.fn.smartform.Constructor.prototype.inject_custom_data = function(_event) {
const inject_custom_data = function(_event) {
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


let ClientDataWrapper
{
    ClientDataWrapper = class {
        constructor ({element, reservationOwner, data, onChange}) {
            this.element = element
            this.state = dataToState(data)
            this.reservationOwner = reservationOwner
            this.onChange = onChange
            this.handleChange = this.handleChange.bind(this)
        }

        async render() {
            return new Promise((resolve) =>
                ReactDOM.render(
                    <ClientData
                        user_entries={this.state.user_entries}
                        game_results={this.state.game_results}
                        reservation_owner={this.reservationOwner}
                        onChange={this.handleChange}
                    />,
                    this.element,
                    resolve,
                )
            )
        }

        handleChange({user_entries, game_results}) {
            let changed = false
            if (user_entries) {
                changed = true
                this.state.user_entries = user_entries
            }
            if (game_results) {
                changed = true
                this.state.game_results = game_results
            }
            if (changed) {
                // this.onChange({...this.state})
                // let React rerender to show the changes and then persist
                // the data to the events annotation, which destroys the popover
                // DOM node and refetches it from the server.
                setTimeout(() =>
                    this.render().then(() =>
                        this.onChange(stateToData(this.state))
                    ),
                    0
                )
            }
        }

        getData() {
            return stateToData(this.state)
        }
        setData(data) {
            this.state = dataToState(data)
            this.render()
        }

    }


    const dataToState = (data) => {
        let {users: user_entries = [], game_results = []} = data || {}
        return {user_entries, game_results}
    }

    const stateToData = (state) => {
        const {user_entries, game_results} = state
        const data = {}
        if (user_entries && user_entries.length > 0) {
            data.users = user_entries
        }
        if (game_results && game_results.length > 0) {
            data.game_results = game_results
        }
        return (
            (Object.keys(data).length === 0)
                ? null
                : data
        )
    }
    
}


window.ReservationDetailsPopover = function (event_id, refetch_func, attachment_func) {
    console.log('intercepted!', event_id)
    const self = new ORIGINAL.ReservationDetailsPopover(event_id, refetch_func, attachment_func);

    self.old_showPopover = self.showPopover
    self.showPopover = function () {
        self.old_showPopover()
        let popover = self.popoverContent[0]
        popover.focus() // doesn't seem to have any effect, maybe it's not visible yet?
    }
    self.show = self.showPopover // rebind alias


    self.old_afterReservationDetailsRender = self.afterReservationDetailsRender
    self.afterReservationDetailsRender = () => {
        // console.log('afterReservationDetailsRender', self)
        
        const popoverNode = self.popoverContent[0]
        const $popoverNode = $(popoverNode)
        const event = $popoverNode.data('event')
        const shouldSkip = (event !== undefined && !is_single_reservation(event))

        let widget
        if (!shouldSkip) {
            const $annotationNode = $(get_event_details_uninited_annotation_node(popoverNode))

            const annData = patchSmartFormInput($annotationNode)
            const reservationOwner = reservation_owner_from_popover($popoverNode)

            const $tab = $popoverNode.find('#tab-information')
            const $root = $(`
                <div
                    style="
                        margin-left: -10px;
                        margin-right: -10px;
                        margin-top: -10px;
                        padding-bottom: 10px;
                    "
                >
                </div>
            `)
            $tab.prepend($root)
            const node = $root[0]

            widget = new ClientDataWrapper({element: node, reservationOwner, data: annData,
                onChange: (data) => write_popover_data(self, data)
            })
            widget.render()

        }
        self.old_afterReservationDetailsRender()

        if (!shouldSkip) {
            // const $smartformRoot = $(popover_annotation_node(self)).closest('[data-smartform-options]')
            const annotationSmartform = $(popover_annotation_node(self)).data('bs.smartform')
            annotationSmartform.inject_custom_data = inject_custom_data
            annotationSmartform.get_custom_data = () => widget.getData()
            annotationSmartform.$element.on('fetchsuccess.bs.smartform', function(_evt, data){
                const annData = patchSmartFormInput(annotationSmartform.inputElements())
                widget.setData(annData)
            })
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


let userFetchController = matchList.createFetchController()

const renderSidebarComponents = () => {
    const today = window.calendar.date
    const reservationsToday = (
        Object.values(window.calendar.reservationsById)
            .filter((r) =>
                r !== undefined &&
                r.event !== undefined &&
                today.isSame(r.event.start, 'day'))
            .sort((ra, rb) => rb.event.start.diff(ra.event.start))
            .map((r) => ({...r, data: annotations.get_data(r.event.annotation)}))
    )

    const onShowReservation = (event_id) => (
        window.calendar.reservationsById[event_id].showDetailsPopover()
    )

    const userEntriesWithCard = (
        reservationsToday
            .flatMap((r) => {
                const event_id = r.event.id
                const data = r.data
                if (!data) { return [] }
                return (data.users
                    .filter((entry) => entry.card)
                    .map((entry) => ({...entry, event_id}))
                )
            })
    )
    
    const cardListWrapper = document.getElementById('card-list-wrapper')
    ReactDOM.render(
        <CardList
            userEntries={userEntriesWithCard}
            className='sidebar-section'
            onShowReservation={onShowReservation}
            onSyncCards={async () => {
                const result = await sync_card_annotations_with_reservation({
                    user_entries: userEntriesWithCard,
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
            }}
        />,
        cardListWrapper
    )

    const matchListWrapper = document.getElementById('match-list-wrapper')

    let matches = []
    for (const r of reservationsToday) {
        const event = r.event
        const data = r.data
        if (!data || !data.users || !data.game_results) { continue }
        for (const match of data.game_results) {
            matches.push({event, match})
        }
    }

    // userFetchController.dispatch(
    //     matchList.requestUsers({userIds: matchList.usersFromMatches(matches)})
    // )

    ReactDOM.render(
        <Provider store={userFetchController}>
            <MatchList
                matches={matches}
                // className='sidebar-section'
                // onShowReservation={onShowReservation}
            />
        </Provider>,
        matchListWrapper
    )
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
    renderSidebarComponents()
    return res
}

window.calendar.reservationsUpdated = function(...args) {
    console.log('reservationsUpdated')
    const res = ORIGINAL.calendar_reservationsUpdated(...args)
    renderSidebarComponents()
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


    const title = this.element.find('.fc-event-title')
    const title_text = title.find('div')
    title.css({display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'})
    title_text.css({marginLeft: 'auto', marginRight: 'auto', padding: '0 0.5ch'})


    const annotation = this.event.annotation
    const is_paid = this.event.className.includes('rsv-paid')
    const is_absent = this.event.className.includes('rsv-not-played')

    const {users: user_entries = [], game_results: scores = []} = (
        annotation
            ? (annotations.get_data(annotation) || {})
            : {}
    )
    const used_cards_num = count_cards(user_entries) || 0

    // should only happen in development, during reloading
    if (event.price_info_promise === undefined) {
        event.price_info_promise = api.fetch_event_price_info(event.id)
    }
    if (!is_absent) {
        this.element.find('.fc-event-inner').append(
            scoreIndicator({
                numPeople: new Set(user_entries.map((e) => e.user.id)).size,
                numScores: scores.length,
                size: 9,
                style: {position: 'absolute', top: '0px', left: '0px'},
                // style: {position: 'absolute', bottom: '0px', right: '0px'},
            })
        )
    }

    let badge = card_count_badge.render({type: 'loading'})
    title.append(badge)

    event.price_info_promise.then((info) => {
        // console.log('fetched price info for', event.id, $(event.title).text(), '->', info)
        const badge_state = card_count_badge.compute_state({
            used_cards_num: used_cards_num,
            is_paid: is_paid,
            price_list_id: info.price_list_id,
            carnets: info.carnets,
            venue_price_info: VENUE_PRICE_INFO[window.venue.id],
        })
        const new_badge = card_count_badge.render(badge_state)
        badge.replaceWith(new_badge)
        badge = new_badge

        if (info.carnets !== null) {
            element.addClass('rsv-has-carnet')
        }
    }).catch((err) => {
        const msg = (
            typeof err === 'object' && err.message !== undefined
                ? err.message
                : 'Unknown error'
        )
        const new_badge = card_count_badge.render({type: 'error'})
        badge.replaceWith(new_badge)
        badge = new_badge

        console.error('Error fetching price info for event', event, err)
        // ui.show_error(msg)
    })
}


const count_cards = (user_entries) => {
    if (user_entries) {
        return user_entries.filter((e)=>e.card).length
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
const POPOVER_EXTRA_CSS = `
.popover.reservationPopover {
    box-shadow: 0 10px 10px rgba(0,0,0, 0.1);
    /*border: 1px solid #c5c5c5;*/
}
`

const EVENT_EXTRA_CSS = `
/* disable 1px padding in .fc-event, because it offsets scoreIndicator */
.fc-event {
    padding: 0;
}

/* make the color of online reservations more consistent with the rest */
.fitnessPanel.rsv-online, .rsv-online, .fc-event.rsv-online {
    background: #71c9ff;
    -webkit-box-shadow: inset 0px 5px 0px 0px rgb(96, 168, 210);
    -moz-box-shadow: inset 0px 5px 0px 0px rgb(96, 168, 210);
    box-shadow: inset 0px 5px 0px 0px rgb(96, 168, 210);
    color: #005b90;
}
`

$(document).ready(() => {
    const head = $('head')
    head.append($('<style id="card-info-badge-styles">').text(card_count_badge.style))
    head.append($('<style id="custom-styles">').text(CARNET_UNPAID_CSS))
    head.append($('<style id="popover-extra-styles">').text(POPOVER_EXTRA_CSS))
    head.append($('<style id="event-extra-styles">').text(EVENT_EXTRA_CSS))
    head.append($('<style id="card-list-styles">').text(CardList.style))
    head.append($('<style id="match-list-styles">').text(MatchList.style))
    head.append($('<style id="client-data-styles">').text(ClientData.style))

    ui.refresh_popovers()
    // window.calendar.updateFullcalendar()
    window.calendar.fetchReservations()
    window.calendar.HAS_ADD_CLIENTS = true
    const cardList = $('<div id="card-list-wrapper">')
    const matchList = $('<div id="match-list-wrapper">')
    $('#tasks-wrapper').before(cardList)
    $('#tasks-wrapper').before(matchList)
    renderSidebarComponents()

    window.reservise_api = api
})