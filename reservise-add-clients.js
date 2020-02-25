// 2020.02.25-r1

// if (Old_ReservationDetailsPopover === undefined) {
//     Old_ReservationDetailsPopover = ReservationDetailsPopover
// }


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

function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

parse_annotation_data = (ann) => {
    const SEPARATOR_RAW   = '---'
    const SEPARATOR       = '\n'+SEPARATOR_RAW+'\n'
    const SEPARATOR_REGEX =  new RegExp('^'+escapeRegExp(SEPARATOR_RAW)+'$', 'm') //  /m - each line separately

    let val, ann_text
    let match = ann.match(SEPARATOR_REGEX)
    if (match === null) {
        console.log('parse_annotation_data ::', 'no separator found', ann)
        ann_text = ann
        val = null
    } else {
        console.log('parse_annotation_data ::', 'found separator', match)
        ann_text = ann.substring(0, match.index - 1) // before leading newline
        let ann_val = ann.substring(match.index + match[0].length + 1) // after trailing newline
        // console.log('parse_annotation_data ::', 'value', ann_val)
        val = JSON.parse(ann_val)
    }
    return [ann_text, SEPARATOR, val]
}

get_annotation_data = (ann) => parse_annotation_data(ann)[2]


modify_annotation_data = (ann, f) => {
    const INITIAL_STATE = {}

    let [ann_text, SEPARATOR, val] = parse_annotation_data(ann)
    let val2 = f((val === null) ? INITIAL_STATE : val)
    return [ann_text, SEPARATOR, JSON.stringify(val2)].join('')
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

serialize_popover_data = (popover) => {
    let $custom_input = $(popover.popoverContent[0]).find('.custom-wrapper')
    let data_serialized = $custom_input.attr('data-extracted')
    let data = JSON.parse(data_serialized)
    let [ann_text, sep, _] = parse_annotation_data(get_popover_annotation(popover))
    return ann_text + ((data === null) ? "" : (sep + data_serialized))
}

save_popover_data = (popover) => {
    let ann = serialize_popover_data(popover)
    modify_popover_annotation(popover, (_) => ann)
}

modify_popover_annotation_data = (popover, f) => {
    let $custom_input = $(popover.popoverContent[0]).find('.custom-wrapper')
    let data = JSON.parse($custom_input.attr('data-extracted')) || {users: []}
    let new_data = f(data)
    let new_data_serialized = JSON.stringify(new_data)
    $custom_input.attr('data-extracted', new_data_serialized)            
    save_popover_data(popover)
}

get_benefit_reservation = () => (
    Object.entries(calendar.reservationsById)
        .find(([id, r]) => (
            r.event !== undefined &&
            ['rsv-active', 'class-event'].every((cls) => r.event.className.includes(cls)) &&
            r.event.title.search(/karty zniżkowe/i) !== -1 // &&
            // document.contains(getp(r, ['element', 0]))
        )) [1]
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

$.fn.smartform.Constructor.prototype.inject_custom_data = function (event) {
    // console.log('SmartForm.inject_custom_data', this, event)
    let $custom_input = this.$element.closest('.event-details').find('.custom-wrapper')
    // console.log('found wrapper', $custom_input)
    let data_serialized = $custom_input.attr('data-extracted')
    let data = JSON.parse(data_serialized)
    this.inputElements().val((i, ann) => {
        let [ann_text, sep, _] = parse_annotation_data(ann)
        let new_ann = ann_text + ((data === null) ? "" : (sep + data_serialized))
        console.log('new annotation', new_ann)
        return new_ann        
    })
    // this.inputElements().val(new_ann)
}


is_class_reservation  = (event) => event.client_list_url !== undefined
is_unavailability     = (event) => event.className.includes('unavailability')
is_single_reservation = (event) => !is_class_reservation(event) && !is_unavailability(event)


if (typeof old_ReservationDetailsPopover === 'undefined') {
    old_ReservationDetailsPopover = ReservationDetailsPopover
}


ReservationDetailsPopover = function(event_id, refetch_func, attachment_func) {
    console.log('intercepted!', event_id)
    var self = new old_ReservationDetailsPopover(event_id, refetch_func, attachment_func);
    // console.log('self', self)

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

        let $custom_input = $(`
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

        // self.$custom_input = $custom_input
        let el = $popover.children('.tab-content')
        el.before($custom_input)
        // let el = $(popover.querySelector('.tab-content #popoverReservationAnnotation'))
        // el.prepend($custom_input)

        let $ann_tag = $(get_event_details_uninited_annotation_tag(popover))
        let [ann_text, _, ann_data] = parse_annotation_data($ann_tag.val())
        $ann_tag.val(ann_text)
        $custom_input.attr('data-extracted', JSON.stringify(ann_data))

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
        popover.focus()
        let $popover = $(popover)
        let event = $popover.data('event')
        // console.log('event', event)
        if (event !== undefined && !is_single_reservation(event)) {
            // console.log('afterReservationDetailsRender :: not a single_reservation, event, ignoring', event)
            return
        }

        // let ann_sf = $(popover_annotation(self)).data('bs.smartform')
        // console.log('form', ann_sf)

        let $custom_input = $(popover).find('.custom-wrapper')
        // console.log('initializing', $custom_input)
        // console.log('extracted', JSON.parse($custom_input.attr('data-extracted')))

        let custom_input_init_state = ($custom_input) => {
            $custom_input.data('state', 'search')
            $custom_input.data('user', null)
            $custom_input.data('lastname',  null)
            $custom_input.data('firstname', null)
            $custom_input.data('card', false)
        }

        let custom_input_update = ($custom_input) => {
            let state = $custom_input.data('state')
            console.log('custom_input_update', state)
            if (state === 'search') {
                let user = $custom_input.data('user')

                $custom_input.find('.custom-add-user-search').show()
                $custom_input.find('.custom-add-user-create').hide()

                if (user === null) {
                    $custom_input.find('.custom-add-user-submit').prop('disabled', true)
                    $custom_input.find('.custom-add-user-clear').hide()
                } else {
                    $custom_input.find('.custom-add-user-submit').prop('disabled', false)
                    $custom_input.find('.custom-add-user-clear').show()
                }

            } else if (state === 'create') {
                $custom_input.find('.custom-add-user-search').hide()
                $custom_input.find('.custom-add-user-create').show()

                let lastname  = $custom_input.data('lastname')
                let firstname = $custom_input.data('firstname')
                if (!firstname || !lastname) {
                    $custom_input.find('.custom-add-user-submit').prop('disabled', true)
                    $custom_input.find('.custom-add-user-clear').hide()
                } else {
                    $custom_input.find('.custom-add-user-submit').prop('disabled', false)
                    $custom_input.find('.custom-add-user-clear').show()
                }

            } else {
                throw new Error(`Invalid custom_input state: \`${state}\``)
            }
        }

        let custom_input_clear = ($custom_input) => {
            let state = $custom_input.data('state')
            if (state === 'search') {
                $custom_input.find('.custom-add-user-search').val('').focus()
                $custom_input.find('.custom-add-user-search').userProfileAutocomplete2('search', '')
            } else if (state === 'create') {
                $custom_input.find('.custom-add-user-create').val('')
            } else {
                throw new Error(`Invalid custom_input state: \`${state}\``)
            }
            custom_input_init_state($custom_input)
            custom_input_update($custom_input)
        }

        let render_user_entry = (entry, i) => (
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


        // // let ann = $(popover_annotation(popover))
        // let ann_text = get_popover_annotation(self)
        // console.log('popover annotation', ann_text)
        // let data = get_annotation_data(ann_text) || {users: []}
        let data = JSON.parse($custom_input.attr('data-extracted')) || {users: []}
        // console.log('popover data', data)
        $custom_input.find('.custom-user-entry-list').append(
            data.users.map((entry, i) =>
                $('<li class="list-group-item"></li>').append(render_user_entry(entry, i))
            )
        )
        $custom_input.find('.custom-user-entry-remove').click((event) => {
            let $clicked = $(event.target)
            let index = $clicked.data('index')
            modify_popover_annotation_data(self, (data)=>{
                data.users.splice(index, 1)
                return data
            })
        })


        custom_input_init_state($custom_input)
        custom_input_update($custom_input)

        let titleCaseWord = (word) => word ? word[0].toUpperCase() + word.substr(1).toLowerCase() : word

        $custom_input.find('.custom-add-user-search').userProfileAutocomplete2({
            showAddClient: true,
            // withFunds: true,
            minLength: 4,
            focus: (evt, ui) => {
                // console.log('user autocomplete :: focus', evt, ui)
                let item = ui.item
                if (/*this.options.showAddClient && */'is_add_new_client' in item) {
                    return false
                }
            },
            select: (evt, ui) => {
                // console.log('user autocomplete :: select', evt, ui)
                let item = ui.item
                if (item === undefined || (typeof item === 'object' && 'is_add_new_client' in item)) {
                    // create new client
                    let search = evt.target.value
                    let parts = search.split(' ').map(titleCaseWord)
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
                    // console.log('switching to create', lastname, firstname)
                    $custom_input.data('state', 'create')
                    custom_input_update($custom_input)       
                    $custom_input.find('.custom-add-user-create-lastname').val(lastname).focus()
                    $custom_input.find('.custom-add-user-create-firstname').val(firstname)
                    $custom_input.find('.custom-add-user-create').change()
                    custom_input_update($custom_input)       
                    return false
                } else {
                    // select existing client
                    let user = (item === null) ? null : {id: item.id, label: item.label}
                    $custom_input.data('user', user)
                    custom_input_update($custom_input)                      
                }
            }
        })

        $custom_input.find('.custom-add-user-create-lastname').change((event)=>{
            // console.log('.custom-add-user-create-lastname', 'change', event)
            $custom_input.data('lastname', event.target.value)
            custom_input_update($custom_input)
        })
        $custom_input.find('.custom-add-user-create-firstname').change((event)=>{
            // console.log('.custom-add-user-create-firstname', 'change', event)
            $custom_input.data('firstname', event.target.value)
            custom_input_update($custom_input)
        })

        $custom_input.find('.custom-add-user-card').change(() => {
            let has_card = $custom_input.find('.custom-add-user-card').prop('checked')
            $custom_input.data('card', has_card)
            custom_input_update($custom_input)
        })
        

        $custom_input.find('.custom-add-user-submit').click(() => {
            // console.log('user autocomplete :: submit', $custom_input.data('user'))
            let state = $custom_input.data('state')
            if (state === 'search') {
                let user = $custom_input.data('user')
                let card = $custom_input.data('card')

                let entry = {user: user, card: card}

                modify_popover_annotation_data(self, (data) => {
                    if (!('users' in data)) { data.users = [] }
                    data.users.push(entry)
                    return data
                })
            } else if (state === 'create') {
                let lastname  = $custom_input.data('lastname')
                let firstname = $custom_input.data('firstname')
                let card = $custom_input.data('card')

                console.log('creating user', lastname, firstname)
                $.ajax({type: 'GET', url: '/clients/create/client/', dataType: 'json'}) .then((data)=> {
                    let csrf = (data.html.match(/<input type='hidden' name='csrfmiddlewaretoken' value='(.+?)'/) || [null, null])[1]
                    if (!csrf) {
                        throw new Error('no csrf token found' + JSON.stringify(data))
                    }
                    return $.ajax({type: 'POST', url: '/clients/create/client/',  dataType: 'json', data: {
                        csrfmiddlewaretoken: csrf,
                        annotation: '',
                        first_name: firstname,
                        last_name: lastname,
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
                }).then((res) => {
                    // res.success
                    let id = Number(res.client_info_url.match(/\/clients\/client\/(\d+)\//)[1])
                    let entry = {user: {id: id, label: lastname + ' ' + firstname}, card: card}
                    console.log('adding entry', entry)

                    return modify_popover_annotation_data(self, (data) => {
                        if (!('users' in data)) { data.users = [] }
                        data.users.push(entry)
                        return data
                    })
                })
                
            } else {
                throw new Error(`Invalid custom_input state: \`${state}\``)
            }
            
            custom_input_clear($custom_input)
        })

        $custom_input.find('.custom-add-user-clear').click(() => {
            // console.log('user autocomplete :: before clear', $custom_input.find('.custom-add-user-search').data('customUserProfileAutocomplete').selectedItem)
            custom_input_clear($custom_input)
            custom_input_update($custom_input)
            // console.log('user autocomplete :: after clear', $custom_input.find('.custom-add-user-search').data('customUserProfileAutocomplete').selectedItem)
        })


        // (() => {

        //     let benefit_res_id = get_benefit_reservation().id
        //     let add_client_url = `/events/create_class_reservation/?event_id=${benefit_res_id}`
        //     let add_client_form = self.$custom_input.find("#add-client-form");
        //         // let x = self.add_client_form.form.find('.userprofile-form-part')
        //         // x.next().find(':not(button)').hide()
        //         // self.$custom_input.find('.fitness-add-client-form').css('display', 'flex')

        //     // $.ajax({
        //     //     url:`/events/create_class_reservation/?event_id=${benefit_res_id}`,
        //     //     method: 'GET',
        //     //     dataType: 'json',
        //     //     success: (data) => {
        //     //         console.log('replacing', self.$custom_input.find('.custom-add-benefit-user-form'))
        //     //         self.$custom_input.find('.custom-add-benefit-user-form').replaceWith($(data.html))
        //     //     }
        //     // })

        // })

    }



    // self.add_class_reservation_to_annotation = (data) => {
    //     console.log('adding to annotation', data)
    //     if (data.updatedReservations.length == 1 &&
    //         data.updatedReservations[0].id !== self.event.id &&
    //         data.updatedReservations[0].className.includes('class-event')
    //         ) {
    //         class_reservation_id = data.phone_url.match(/\/sms\/send\/class_reservation_notification\/(\d+)/)[1]
    //         modify_popover_annotation(self, (ann) =>
    //             modify_annotation_data(ann, (val)=>{
    //                 if (!('class_reservations' in val)) {
    //                     val.class_reservations = []
    //                 }
    //                 val.class_reservations.push(class_reservation_id)
    //                 return val
    //             })
    //         )
    //     }
    // }


    return self
}



if (calendar.old_feedReservationCache === undefined) {
    calendar.old_feedReservationCache = calendar.feedReservationCache
}

calendar.feedReservationCache = function(data) {
    console.log('calendar.feedReservationCache', `${data.length} items`)
    return calendar.old_feedReservationCache(
        data.map((event) => {
            event.price_info_promise = fetch_event_price_info(event.id)
            return event
        })
    )
}




if (ReservationEvent.prototype.old_collectAnnotations === undefined) {
    ReservationEvent.prototype.old_collectAnnotations = ReservationEvent.prototype.collectAnnotations
}

ReservationEvent.prototype.collectAnnotations = function() {
    annotations = this.old_collectAnnotations()
    return annotations.map((ann) =>
        (ann.type === 'unit') ?
            (ann.annotation = parse_annotation_data(ann.annotation)[0], ann) :
            ann
    )
};


count_cards = (ann_data) => {
    if (ann_data) {
        return ann_data.users.filter((e)=>e.card).length
    }
    return null
}

card_count_badge = (used, required, has_carnet, carnet_ms, is_paid) => {
    if (required === 0 && (has_carnet === false || carnet_ms === 0)) {
        return $(null)
    }
    let badge = $(`<span class="badge badge-pill badge-primary" style="padding: 2px 5px"></span>`)
    if (used === null || required === null || has_carnet === null || is_paid === null) {
        badge .append(spinner_small()) .css({backgroundColor: 'gray', opacity: '0.3'})
    } else if (!is_paid && has_carnet === true) {
        badge .text(`${carnet_ms - used}`) .css({backgroundColor: 'rgba(0,0,0, 0.3)'})
    // } else if (required === 0 && has_carnet === true) {
    //     badge .text() .css({backgroundColor: 'rgba(0,0,0, 0.3)'})
    } else if (used == required) {
        badge .text('✓') .css({backgroundColor: 'gray', opacity: '0.3'})
    } else {
        badge .text(`${required - used}`) .css({backgroundColor: '#007bff'})
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
            // return Promise.all(reqs).then((new_carnets) => (
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

    let annotation = this.event.annotation
    let is_paid = this.event.className.includes('rsv-paid')

    let ann_data
    if (annotation) {
        [_, _, ann_data] = parse_annotation_data(annotation)
    } else {
        ann_data = {users: []}
    }

    let used_cards_num = count_cards(ann_data) || 0

    let title = this.element.find('.fc-event-title')
    let title_text = title.find('div')
    title.css({display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'})
    title_text.css({marginLeft: 'auto', marginRight: 'auto'})

    // should only happen in development, during reloading
    if (event.price_info_promise === undefined) {
        event.price_info_promise = fetch_event_price_info(event.id)
    }
    let pending_badge = (event.price_info_promise.isResolved)
        ? $('<span></span>')
        : card_count_badge(used_cards_num, null, null, null)
    title.append(pending_badge)

    event.price_info_promise.then((info) => {
        let {price_list_id, carnets} = info
        console.log('fetched price info for', event.id, $(event.title).text(), '->', info)
        let required_cards_num = PRICE_CARD_COUNT[PRICE_LIST_ID_NAMES[price_list_id]] || 0
        let has_carnet = (carnets !== null)
        let carnet_ms = (carnets !== null) ? (CARNET_TYPE_MS_COUNT[Object.values(carnets)[0].type] || 0) : null
        let badge = card_count_badge(used_cards_num, required_cards_num, has_carnet, carnet_ms, is_paid)
        pending_badge.replaceWith(badge)
    })
}




PRICE_CARD_COUNT = {
    'Cennik Standardowy':                                                   0,
    'Mam 1 Kartę MultiSport Plus/FitProfit/OK System':                      1,
    'Mam 2 Karty MultiSport Plus/FitProfit/OK System':                      2,
    'Karnet 5h':                                                            0,
    'Karnet 10h':                                                           0,
    'Karnet 5h - 1 karta zniżkowa':                                         1,
    'Karnet 10h - 1 karta zniżkowa':                                        1,
    'Karnet 10h - 2 karty zniżkowe':                                        2,
    'Juniorzy, Studenci (<26l) - 1h':                                       0,
    'Juniorzy, Studenci (<26l) - 1 karta zniżkowa':                         1,
    'Juniorzy, Studenci (<26l) - 2 karty zniżkowe':                         2,
    'Open Juniorzy, Studenci (<26 l)  - karnet 5h':                         0,
    'Open Juniorzy, Studenci (<26 l)  - karnet 10h':                        0,
    'Open Juniorzy, Studenci (<26 l)  - karnet 5h - jedna karta zniżkowa':  1,
    'Open Juniorzy, Studenci (<26 l)  - karnet 10h - jedna karta zniżkowa': 1,
}

PRICE_LIST_ID_NAMES = {
    ''    : 'Własna cena',
    '1707': 'Cennik Standardowy',
    '1708': 'Mam 1 Kartę MultiSport Plus/FitProfit/OK System',
    '1709': 'Mam 2 Karty MultiSport Plus/FitProfit/OK System',
    '1710': 'Mam 1 Kartę OK System Gold',
    '1711': 'Karnet 5h',
    '1712': 'Karnet 10h',
    '1713': 'Karnet 5h - 1 karta zniżkowa',
    '1714': 'Karnet 10h - 1 karta zniżkowa',
    '1756': 'Liga - cena hurtowa',
    '1757': 'Juniorzy, Studenci (<26l) - 1h',
    '1758': 'Juniorzy, Studenci (<26l) - 1 karta zniżkowa',
    '1759': 'Juniorzy, Studenci (<26l) - 2 karty zniżkowe',
    '1760': 'Open Juniorzy, Studenci (<26 l)  - karnet 5h',
    '1761': 'Open Juniorzy, Studenci (<26 l)  - karnet 10h',
    '1762': 'Open Juniorzy, Studenci (<26 l)  - karnet 5h - jedna karta zniżkowa',
    '1763': 'Open Juniorzy, Studenci (<26 l)  - karnet 10h - jedna karta zniżkowa',
    '1918': 'Cennik trenerski',
    '1936': 'Karnet 10h - 2 karty zniżkowe',
    '2380': '__Goodie z kodem',
    '3107': 'DoRozliczenia',
}

CARNET_TYPE_MS_COUNT = {
    478: 1,
    364: 1,
    365: 1,
    366: 1,
    502: 2,
    504: 2,
    503: 2,
    501: 2,
    477: 1,
    361: 1,
    362: 1,
    363: 1,
    481: 1,
    480: 1,
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


_refreshPopovers()
// calendar.updateFullcalendar()
calendar.fetchReservations()
calendar.HAS_ADD_CLIENTS = true
