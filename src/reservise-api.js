import { $ajax_promise } from './utils'


const html_entities_decode = (s) => $("<div>").html(s).text()

export const fetch_event_price_info = (id) => (
    $ajax_promise({
        url: '/events/event_details/', data: { id: id },
        dataType: "json",
    }).then(({html}) => {
        let [, price_list_id = null] = html.match(/data-price-list-id="(\d+)"/) || []
        price_list_id = (
            (price_list_id !== null && price_list_id !== "")
                ? Number(price_list_id)
                : null
        )
        let [, carnet_raw = null] = html.match(/data-carnets="(.+?)"/) || []
        let carnets = (carnet_raw !== null && carnet_raw !== '{}')
            ? JSON.parse(html_entities_decode(carnet_raw))
            : null
        if (carnets === null) {
            return {price_list_id: price_list_id, carnets: carnets}
        } else {
            let client_id = (html.match(/\/clients\/c\/(\d+)\//) || [null, null])[1]
            if (client_id === null) { throw new Error(`no client id found for event ${id}`) }
            // client_id = Number(client_id)
            let reqs = Object.entries(carnets).map(([carnet_id, carnet]) => {
                return $ajax_promise({
                    url: `/clients/carnet/create/${client_id}/`, dataType: 'json',
                    data: {carnet: carnet_id},
                }).then(({html: carnet_html}) => {
                    let carnet_type = (
                        carnet_html.match(/<option value="(\d+)" price="[^"]+" days="[^"]+" resources="[^"]+" selected="selected">/)
                        || [null, null]
                    )[1]
                    if (carnet_type === null) {
                        throw new Error(`INTERNAL ERROR: no carnet type found for user ${client_id}, carnet ${carnet_id}`)
                    }
                    carnet.type = Number(carnet_type)
                    return [carnet_id, carnet]
                })
            })
            return Promise.all(reqs).then((new_carnets) => (
                {price_list_id: price_list_id, carnets: Object.fromEntries(new_carnets)}
            ))
        }
    })
)





export const class_event_reservations = (event_id) => {
    return class_event_reservations_raw(event_id).then((text) => parse_class_reservation($(text)))
}


const class_event_reservations_raw = (event_id) => {
    return $.get(`/events/class_event_reservations_list/${event_id}`)
}

const parse_class_reservation = (modal) => {
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




export const add_class_reservation = ({client_id, event_id, price_list_id, price = ''}) => {
    let add_client_url = `/events/create_class_reservation/?event_id=${event_id}`
    return $ajax_promise({type: 'GET', url: add_client_url, dataType: 'json', }).then((data) => {
        let [, csrf = null] = data.html.match(/<input type='hidden' name='csrfmiddlewaretoken' value='(.+?)'/) || []
        if (!csrf) {
            throw new Error('no csrf token found' + JSON.stringify(data))
        }
        return $ajax_promise({type: 'POST', url: '/events/create_class_reservation/',  dataType: 'json', data: {
            csrfmiddlewaretoken: csrf,
            event_id,
            user_profile: client_id,
            price_list: `${price};${price_list_id}`,
            value: price,
            last_name: '',
            first_name: '',
            phone_number: '',
            email: '',
            annotation: '',
            create_new_client: '',
        }})
    })
}






export const create_client = (client_data) => {
    for (let param of ['last_name', 'first_name']) {
        if (!(param in client_data)) {
            throw new Error(`INTERNAL ERROR: Required named parameter '${param}' not present`)
        }
    }
    return _create_client(client_data).then((res) => {
        if (!(typeof res === "object" && res.success === true)) {
            let msg = ""
            if (typeof res === "object" && res.html !== undefined) {
                msg = parseCreateClientFormErrors(res.html).join('\n')
            }
            if (!msg) {
                msg = "Could not create user"
            }
            throw new Error(msg)
        }
        let match = res.client_info_url.match(/\/clients\/client\/(\d+)\//)
        if (!match) {
            throw new Error(`INTERNAL ERROR: Could not recognize user ID from url: ${res.client_info_url}`)
        }
        let id = parseInt(match[1])
        if (Number.isNaN(id)) {
            throw new Error(`INTERNAL ERROR: User ID is not a number: ${id}`)
        }

        return {id: id}
    })
}

const _create_client = ({last_name, first_name, email = '', phone_number = ''}) => (
    $ajax_promise({
        type: 'GET', url: '/clients/create/client/', dataType: 'json',
    }).then((data)=> {
        let [, csrf] = data.html.match(/<input type='hidden' name='csrfmiddlewaretoken' value='(.+?)'/) || []
        if (!csrf) {
            throw new Error('INTERNAL ERROR: no csrf token found in response: ' + JSON.stringify(data))
        }
        return $ajax_promise({type: 'POST', url: '/clients/create/client/',  dataType: 'json', data: {
            csrfmiddlewaretoken: csrf,
            annotation: '',
            first_name,
            last_name,
            email,
            phone_number,
            discount: 0,
            enable_sms_notifications: 'on',
            enable_creating_reservations: 'on',
            is_new_player: 'on',
            birth_date: '',
            address: '',
            zip_code: '',
            venue: window.venue.id, // global
        }})
    })
)

const parseCreateClientFormErrors = (formText) => {
    const form = document.createElement('div')
    form.innerHTML = formText
    const messages = (
        [...form.querySelectorAll('.label.label-form-error')]
            .map((label) => label.innerText.trim())
    )
    form.remove()
    return messages
}

export const get_client = async ({client_id}) => {
    const data = await $ajax_promise({
        type: 'GET',
        url: `/clients/client/${client_id}/get/form/`,
        dataType: 'json',
    })
    const client = parseClientForm(data.html)
    client.id = client_id
    return client
}



export const fetchAPI = (fetch) => ({
    get_client: async ({client_id}) => {
        const res = await fetch(`/clients/client/${client_id}/get/form/`)
        const data = await res.json()
        const client = parseClientForm(data.html)
        client.id = client_id
        return client
    }
})



export const CLIENT_FIELDS = [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'annotation',
    // 'discount',
    // 'enable_sms_notifications',
    // 'enable_sms_marketing',
    // 'enable_creating_reservations',
    // 'is_new_player',
    // 'birth_date',
    // 'address',
    // 'zip_code',
    // 'groups',
    // 'venue',
]

const parseClientForm = (formText) => {
    const form = document.createElement('div')
    form.innerHTML = formText
    const messages = Object.fromEntries(
        [...form.querySelectorAll('input[name],textarea[name]')]
            .map((input) => [input.name, input.value])
            .filter(([name,]) => CLIENT_FIELDS.includes(name))
    )
    form.remove()
    return messages
}