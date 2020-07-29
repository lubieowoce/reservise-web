import { add_class_reservation } from './reservise-api'
import { VENUE_PRICE_INFO } from './price-info'

export const refresh_popovers = () => {
    window.cleanPopovers();
    (Object.values(window.calendar.reservationsById)
        .filter((e)=>e.detailsPopover)
        .forEach((e)=>{
            e.detailsPopover.outdate();
            e.detailsPopover.destroy();
            e.createDetailsPopover();
        })
    );
}

export const get_benefit_reservation = () => {
    const today = window.calendar.date
    return (
        Object.entries(window.calendar.reservationsById)
            .filter(([_id, r]) => (
                r.event !== undefined &&
                ['rsv-active', 'class-event'].every((cls) => r.event.className.includes(cls)) &&
                r.event.title.search(/karty zniżkowe/i) !== -1 &&
                today.isSame(r.event.start, 'day')
                // document.contains(getp(r, ['element', 0]))
            )) [0][1]
    )
}


export const add_benefit_reservation = ({client_id, benefit_res_id = null}) => {
    if (benefit_res_id === null) {
        benefit_res_id = get_benefit_reservation(window.calendar).id
    }
    const price = '15.00'
    const price_list_id = VENUE_PRICE_INFO[window.venue.id].class_prices.benefit
    return add_class_reservation({client_id, event_id: benefit_res_id, price, price_list_id})
}


const { Message } = window

export const show_error = (msg) => {
    window.messages.appendMessage(
        Message.createMessage(msg, 'danger'),
        true
    )
}

export const show_critical_error = (msg) => {
    window.messages.appendMessage(
        Message.createMessage(msg, 'critical'),
        true
    )
}