/*
badge:
    loading {}
    ready   {used: int, required: int, paid: bool}
    unknown {msg: str}
    error   {msg: str}
*/

const { ich: ICH_templates } = window


export const compute_state = ({used_cards_num, price_list_id, carnets, is_paid, venue_price_info}) => {
    let price_info = venue_price_info.prices[price_list_id]
    if (price_info === undefined) {
        return {type: 'unknown', msg: `Unknown price (price_list_id: ${price_list_id})`}
    } else {
        let required_cards_num
        if (is_paid || (!is_paid && carnets === null)) {
            required_cards_num = price_info.cards
        } else { // !is_paid && carnets !== null 
            let carnet_type = Object.values(carnets)[0].type
            let carnet_price_info = venue_price_info.carnets[carnet_type]
            if (carnet_price_info === undefined) {
                return {type: 'unknown', msg: `Unknown carnet (carnet_type: ${carnet_type})`}
            }
            required_cards_num = carnet_price_info.cards
        }
        return {type: 'ready', used: used_cards_num, required: required_cards_num, paid: is_paid}
    }  
}

export const render = (state) => {
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

    } else if (state.type === 'unknown') {
        badge = make_badge()
        badge .text('?') .addClass('unknown')
    } else if (state.type === 'error') {
        badge = make_badge()
        badge .text('!') .addClass('error')
    }

    return badge
}

const BOOTSTRAP_COLORS = {
    success: 'rgb(40, 167, 69)', // green
    primary: 'rgb(0,123,255)', // blue
}

export const style = `
    .badge.card-info-badge { padding: 2px 5px; }
    .badge.card-info-badge.loading   { background-color: gray;          opacity: 0.3; }
    .badge.card-info-badge.guessed   {                                  opacity: 0.6; }
    .badge.card-info-badge.missing   { background-color: ${BOOTSTRAP_COLORS.primary}; }
    .badge.card-info-badge.fulfilled { background-color: gray;          opacity: 0.3; }
    .badge.card-info-badge.extra     { background-color: ${BOOTSTRAP_COLORS.success}; }
    .badge.card-info-badge.error     { background-color: gray;          opacity: 0.5; }
    .badge.card-info-badge.unknown   { background-color: gray;          opacity: 0.3; }
`

const spinner_small = () => {
    let spinner = ICH_templates.spinner().css({width: '10px'})
    spinner.find('img').css({maxWidth: '100%'})
    return spinner
}
