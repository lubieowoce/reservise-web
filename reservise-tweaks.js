// 2020.02.25-r1

// url:  .*reservise\.com/(?:calendar|clients).*

// F1 - add_benefit_card()
// F2 - edit_popup_price()
// F4 - click_popup_present()

// ShortKeys config
/*
[
 {"key":"F1","action":"javascript","blacklist":"whitelist","sites":"*reservise.com/calendar*","open":false,"customName":"add-benefit-card","code":"add_benefit_card()","exported":true,"sitesArray":["*reservise.com/calendar*"],"activeInInputs":true},
 {"key":"F2","action":"javascript","blacklist":"whitelist","sites":"*reservise.com/calendar*","open":false,"customName":"edit-popup-price","code":"edit_popup_price()","exported":true,"sitesArray":["*reservise.com/calendar*"],"activeInInputs":true},
 {"key":"F4","action":"javascript","blacklist":"whitelist","sites":"*reservise.com/calendar*","open":false,"customName":"click-popup-present","code":"click_popup_present()","exported":true,"sitesArray":["*reservise.com/calendar*"],"activeInInputs":true}
]
*/

const PRICE = {
    do_rozliczenia:    22,
    cennink_trenerski: 19
}

const BENEFIT = "15.00;1646"
const KEYCODE_ESCAPE = $.ui.keyCode.ESCAPE



// document.removeEventListener('focusin', watch_price)

// document.addEventListener('focusin', watch_price)
// function watch_price(e) {
//     let target = e.target
//     if (target.id != 'id_price_list') {
//         return
//     }

//     console.log("watching", target, "existing listeners:", $(target).data("events"))
//     const event_types = ['keydown', 'keypress', 'keyup', 'input']
//     for (event_type of event_types) {
//         document.addEventListener(event_type, listen_price_keys, {capture: true})
//     }
//     target.addEventListener("focusout", (_) => {
//         console.log("stopping watching", target)
//         for (event_type of event_types) {
//             document.removeEventListener(event_type, listen_price_keys)
//         }
//     }, {once: true, passive: true})
// }

// PRICE_INPUTTING_SPECIAL = false

// function listen_price_keys(e) {
//     console.log(e)
//     if (e.type == 'input') {
//         return
//     }
//     if (!PRICE_INPUTTING_SPECIAL && e.key == ";") {
//         PRICE_INPUTTING_SPECIAL = true
//         return
//     }
//     else if (PRICE_INPUTTING_SPECIAL && e.key == "Enter") {
//         PRICE_INPUTTING_SPECIAL = false
//         return
//     }
//     else if (PRICE_INPUTTING_SPECIAL) {
//         console.log("special", e.key)
//         return
//     }
//     else if (!PRICE_INPUTTING_SPECIAL) {
//         console.log(e.type, "watching, got key", e.key)
//     }
// }


install_escape()

function install_escape() {
    $(document).keyup(handle_escape);
}

function handle_escape(e) {
    if (e.which === KEYCODE_ESCAPE) {
        console.log('escape')
        let _active = document.activeElement
        let active = $(_active)
        let is_focused_input = (active.is(':input') && active.is(':focus'))
        if (!is_focused_input) {
            close_current_popup()
        }
        console.log("blurring", active[0])
        active.blur();
        // if (active !== null && active !== document.body && is_visible(active) ) {
        //     let popup = find_enclosing_popup(active)
        //     if (popup !== null) {
        //         console.log("focusing parent:", popup)
        //         $(popup).focus()
        //     }
        // } else {
        //     close_current_popup()
        // }
    }
}

async function edit_popup_price() {
    let popup = find_current_popup()
    if (popup === null || !is_reservation_popover(popup)) { return null }
    return click(await edit_price(popup))
}

function click_popup_present() {
    let popup = find_current_popup()
    console.log('press_popup_present :: popup', popup)
    if (popup === null || !is_reservation_popover(popup)) { return null }
    let present = popup.querySelector('.checkPresence')
    console.log('press_popup_present :: present', present)
    if (present === null) { return null }
    click(present)
    return present
}


async function add_benefit_card() {
    console.log('add_benefit_card')
    if (typeof calendar === 'undefined') {
        console.log("no access to `calendar` global var in window", window)
        return
    }
    if (calendar.HAS_ADD_CLIENTS === true) {
        let popup = find_current_popup()
        if (popup === null || !is_reservation_popover(popup)) { return }
        let custom_user_search = popup.querySelector('.custom-wrapper .custom-add-user-search')
        if (custom_user_search === null) { return }
        custom_user_search.focus()
    } else {
        let benefit_reservation = Object.entries(calendar.reservationsById)
            .filter(([id, r]) => (
                getp(r, ['event', 'className'], []).includes('class-event') &&
                getp(r, ['event', 'title'], '').search(/karty zniżkowe/i) !== -1 &&
                document.contains(getp(r, ['element', 0]))
            ))
            .map(([_, r]) => r) [0]
        let benefit_box = benefit_reservation.element[0]

        // let benefit_box = [...document.querySelectorAll('.fc-event-title')].filter((n) => n.textContent.search('Karty zniżkowe') !== -1)[0].parentNode.parentNode
        let btn = benefit_box.querySelector('.add-client-to-class-event-icon')
        click(btn)

        // await sleep(500)
        // let _input = document.activeElement
        // console.log('blurring', _input)
        // $(_input).blur()
        // await sleep(500)

        // let popover = await retryUntil((x) => notNull(x) && no_spinner(x), find_reservation_popover, "popover search")

        // let price = popover.querySelector('select#id_price_list')


        // let price = await waitSelector(document, 'select#id_price_list', "price list search")
        
        // $(price).val(BENEFIT)

        // let input = document.querySelector('#add-client-form input.userprofile-autocomplete')
        // input.focus()
        // return price
        
    }
}



function click(node) { console.log('click::', node); $(node).trigger('click') }
function hover(node) { $(node).trigger('mouseenter') }

function sleep(t) { 
    return new Promise(resolve => {
        setTimeout(()=>resolve(null), t);
    });
}

async function soon(f) {
    await sleep(5000)
    let x = f()
    if (typeof x === 'Promise') {
        x = await x
    }
    return x
} 

function is_hidden(el) { return window.getComputedStyle(el).display === 'none' }
// function is_hidden(el) { return el.offsetParent === null }
function is_visible(el) { return window.getComputedStyle(el).display !== 'none' }

function no_add_missing_phone_number() {
    function DummyFillPhoneNumberForm(url, onSuccess) {
        this.url = url;
        this.onSuccess = onSuccess;
        console.log("fill number", this)
    }
    _FillPhoneNumberForm = FillPhoneNumberForm
    FillPhoneNumberForm = DummyFillPhoneNumberForm
}

function search_selector(search_start, selector, search_direction) {
    console.log('search_selector', search_start, selector, search_direction)
    if (!is_visible(search_start)) { return null }
    if (search_direction === 'up') {
        return search_start.closest(selector)
    } else if (search_direction === 'down') {
        return getp([...search_start.querySelectorAll(selector)].filter(is_visible), 0, null)
    }
    else {
        throw "invalid search direction: " + search_direction
    }
}

function isEmpty(obj) { return Object.entries(obj).length === 0 }

function getp(obj, path, _default=undefined) {
    if (typeof path !== 'object') { path = [path] }
    for (let prop of path) {
        // console.log("getp :: ", prop)
        if (typeof obj[prop] !== 'undefined') {
            obj = obj[prop]
        } else {
            return _default
        }
    }
    return obj
}

function nice_modals() {
   let style =  `
    .modal-backdrop {
      display: none;
    }

    .modal {
      overflow:   unset;
      overflow-y: unset;
      bottom:     unset;
      left:       unset;
      scale: 0.7;
    }
    `
}


// function close_all_popups() {
//     console.log('close_all_popups')
//     // cleanPopovers() // Reservise - doesn't close  [ Reject | Confirm ]  prompts
//     let btns = [...document.querySelectorAll('.popover .popover-close-button'), ...document.querySelectorAll('.modal-dialog [data-dismiss=modal]')]
//     for (let x of btns) {
//         if (x !== null && window.getComputedStyle(x).display !== 'none') { 
//             click(x)
//         }
//     }
// }

function close_current_popup() {
    console.log('close_current_popup')
    let popup = find_current_popup()
    if (popup !== null) { console.log('close_current_popup :: closing'); return close_popup(popup) }
    return null
}


function find_current_popup() {
    console.log('find_current_popup')
    let active = document.activeElement
    console.log('find_current_popup :: active', active)
    if (active !== null && is_visible(active)) {
        let popup = find_enclosing_popup(active)
        if (popup !== null) { console.log('find_current_popup :: found parent'); return popup }
    } 
    let popup = find_popup(document.body)
    if (popup !== null) { console.log('find_current_popup :: found child'); return popup }
    return null
}


function close_popup(node) {
    if(is_modal(node)) {
        return close_modal(node) 
    } else if (is_popover(node)) {
        return close_popover(node) 
    }
    return null
}

function find_enclosing_popup(node) {
    let modal = is_modal(node) ? node : find_modal(node, 'up')
    if (modal !== null) { return modal }
    let popover = is_popover(node) ? node : find_popover(node, 'up')
    if (popover !== null) { return popover }
    return null
}

function find_popup(node) {
    let modal = find_modal(node, 'down')
    if (modal !== null) { return modal }
    let popover = find_popover(node, 'down')
    if (popover !== null) { return popover }
    return null
}

function is_modal(node) { return node.classList.contains('modal') }

function find_modal(search_start, search_direction) {
    return search_selector(search_start, '.modal', search_direction)
}

function close_modal(node) {
    console.log('close_modal', node)
    let close = node.querySelector('[data-dismiss]')
    console.log('close_modal :: close', close)
    if (close === null) { return null }
    // console.log('close_modal :: click', close)
    click(close)
    return close
}



function is_reservation_popover(node) { return is_popover(node) && node.classList.contains('reservationPopover') }
function is_popover(node) { return node.classList.contains('popover') }

function find_popover(search_start, search_direction) {
    return search_selector(search_start, '.popover', search_direction)
}

function close_popover(node) {
    console.log('close_popover', node)
    let close = node.querySelector('.popover-close-button')
    console.log('close_popover :: close', close)
    if (close === null) { return null }
    // console.log('close_popover :: click', close)
    click(close)
    return close
}


// soon(close_current_popup)





function find_reservation_popover() { return document.querySelector('.reservationPopover')}

function find_spinner(root) { return root.querySelector('.spinner')}
function no_spinner(root) { s = find_spinner(root); return isNull(s) || is_hidden(s) }


function switch_to_price_tab(node=null) {
    console.log('switch_to_price_tab')
    if (node === null) { node = document.querySelector('.reservationPopover') }
    let btn = node.querySelector('a[href="#tab-payments"]')
    if (btn !== null) {
        click(btn)
    }
}

function find_price_input(node=null) {
    if (node === null) { node = document.querySelector('.reservationPopover') }
    let price = node.querySelector('#id_price_list')
    console.log('find_price_input ::', price)
    return price
}

async function edit_price(node=null) {
    console.log('edit_price')
    if (node === null) { node = document.querySelector('.reservationPopover') }
    let btn = await waitSelector(node, 'a.edit-prices', "edit btn search")
    click(btn)
    let price = await retryUntil(notNull, (()=>find_price_input(node)), "input search")
    // if (price !== null) {
    $(price).focus()
    // }
    return price
}


function input_price(ix, node=null) {
    console.log('input_price')
    if (node === null) { node = document.querySelector('.reservationPopover') }
    let price = find_price_input()
    if (price !== null) {
        price.options.selectedIndex = ix
        $(price).trigger('change')
    }
    // save_price()
}

function save_price(node=null) {
    console.log('save_price')
    if (node === null) { node = document.querySelector('.reservationPopover') }
    let submit_btn = node.querySelector('form.price_form button[type="submit"]')
    if (submit_btn !== null) {
        click(submit_btn)
    }
    return submit_btn
}



function mark(node) {
    if (!node.classList.contains('fc-event')) {
        node = node.closest('.fc-event')
    }
    node.style.backgroundColor = 'tomato'
}



// calendar.reservationsById
// calendar.nonGhostsCache


// async function get_event_details(reservation_node) {
//     click(reservation_node)
//     await sleep(1000)
//     let node = document.querySelector('.reservationPopover')
//     let details = JSON.parse(node.querySelector('.event-details').getAttribute('data-event'))
//     close_popup(node)
//     node.style.backgroundColor = "tomato"
//     return details
// }

// function event_details(node=null) {
//     if (node === null) { node = document.querySelector('.reservationPopover') }
//     return JSON.parse(node.querySelector('.event-details').getAttribute('data-event'))
// }

async function retryUntil(pred, f, label=null) {
    let attempts = 20
    while (attempts > 0) {
        let x = f()
        if (pred(x)) {
            let msg = 'retryUntil :: done with'
            if (label !== null) { msg += " " + label }
            console.log(msg, x)
            return x
        } else {
            await sleep(500)

            let msg = 'retryUntil :: retrying'
            if (label !== null) { msg += " " + label }
            msg += " " + attempts + " attempts left"
            console.log(msg)
        }
        attempts -= 1
    }
    throw ("retryUntil :: waited too long for " + label)
}

function notNull(x) { return x !== null }
function isNull(x) { return x === null }
function defined(x, path=null) {
    if (path===null || path.length===0) {
        return typeof x !== 'undefined'
    } else {
        return typeof getp(x, path) !== 'undefined'
    }
} 



async function waitSelector(root, selector, label=null) {
    return await retryUntil(notNull, (() => root.querySelector(selector)), label!==null?label:selector)
}

function expect_defined(x, label) { if (typeof x === 'undefined') { throw "expected " + label + " to be defined"} }

function is_liga(reservation) {
    return getp(reservation, ['event', 'clients', 0, 'annotation'], '') === 'LIGA ŚRODA';
}

async function set_liga_dorozliczenia() {
    let ligaIds = (
        Object.entries(calendar.reservationsById)
            .filter(([id, r]) => is_liga(r))
            .map(([id, _]) => id)
    )
    let i = 0
    for (let ligaId of ligaIds) {
        // if (i > 6) { break }
        let eventNode = calendar.reservationsById[ligaId].element[0]
        console.log(ligaId, eventNode)
        hover(eventNode)
        await sleep(500)
        click(eventNode)
        $(eventNode).trigger('mouseleave')
        await sleep(800)

        await retryUntil((x) => notNull(x) && no_spinner(x), find_reservation_popover, "popover search")
        let details = await retryUntil((x) => defined(x) && defined(x, 'classList') && !(x.classList.contains('spinner')),
            () => getp(calendar.reservationsById[ligaId], ['detailsPopover', 'popoverContent', 0])
        )

        await edit_price(details)
        await sleep(500)


        input_price(PRICE.do_rozliczenia, details)
        await sleep(500)

        save_price(details)
        // await retryUntil(isNull, find_price_input, "price input disappear")
        await sleep(100)
        await retryUntil(no_spinner,
            () => getp(calendar.reservationsById[ligaId], ['detailsPopover', 'popoverContent', 0])
        )
        await sleep(500)

        // i+=1

        // await sleep(2000)
        let close_btn = await retryUntil(defined, () => getp(calendar.reservationsById[ligaId], ['detailsPopover', 'popoverContent', 2]))
        // expect_defined(close_btn, 'close_btn')
        click(close_btn)
        await retryUntil(isNull, find_reservation_popover, "popover disappear")
        // await sleep(2000)
        // i += 1
    }
}

// set_liga_dorozliczenia()

// soon(add_benefit_card)
