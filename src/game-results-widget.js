import React, {
    useState, useCallback,
    Fragment,
} from 'react'

import { sortBy, keyBy } from 'lodash'
import {
    List as IList,
    Map as IMap,
    fromJS as immFromJS,
} from 'immutable'

const results_from_JS = (results) => IMap(results.map(([ids, score]) => [IList(ids), score]))
const results_to_JS = (results) => [...results.entries()].map(([ids, r]) => [ids.toJS(), r])

export const removeResultsWithUser = (results, {id}) => (
    results.filter(([[id1, id2]]) => id1 !== id && id2 !== id)
)

export const userHasResults = (results, {id}) => (
    results.some(([[id1, id2]]) => id1 === id || id2 === id)
)


// const userScores = (results, {id}) => {
//     const res = {first: [], second: []}
//     for (const [ids, score] of results) {
//         const [id1, id2] = ids
//         if (ids.includes(id)) {
//             const [pos, other] = id1 === id ? ['first', id2] : ['second', id1]
//             res[pos].push([other, score])
//         }
//     }
//     return res
// }

export const replaceUser = (results, {oldId, newId}) => {
    if (userHasResults(results, {id: newId})) {
        // user already presdent
        // TODO: try to merge results if possible
        return removeResultsWithUser(results, {id: oldId})
    }
    return results.map((result) => {
        const [[id1, id2], score] = result
        if (id1 === oldId) {
            return [[newId, id2], score]
        }
        else if (id2 === oldId) {
            return [[id1, newId], score]
        }
        else {
            return result
        }
    })
}

// export const replaceUser = (results, {oldId, newId}) => (
//     results.map((result) => {
//         const [[id1, id2], score] = result
//         if (id1 === oldId) {
//             return [[newId, id2], score]
//         }
//         else if (id2 === oldId) {
//             return [[id1, newId], score]
//         }
//         else {
//             return result
//         }
//     })
// )

export const GameResults = ({game_results, users, onChange}) => {
    console.log('<GameResults>', {game_results, users})
    // const user_ids = sortBy(users, 'name').map(({id}) => id)
    const user_ids = users.map(({id}) => id)
    const users_by_id = keyBy(users, 'id')

    game_results = results_from_JS(game_results)

    const [modified_results, set_modified_results] = useState(IMap())

    const did_change = modified_results.count() > 0
    let all_results = game_results.merge(modified_results)
    for (let [id1, id2] of pair_combinations(user_ids)) {
        const ids    = IList([id1, id2])
        const idsRev = IList([id2, id1])
        if (!all_results.has(ids) && !all_results.has(idsRev)) {
            all_results = all_results.set(ids, null)
        }
    }

    const modify_result = (ids, result) => {
        if (game_results.get(ids) === result) { return }
        set_modified_results(modified_results.set(ids, result))
    }

    const revert_results = () => {
        set_modified_results(IMap())
    }

    const save_results = () => {
        if (!did_change) { return }
        const results2 = results_to_JS(game_results.merge(modified_results).filter((r) => r))
        onChange(results2)
        set_modified_results(IMap())
    }

    return (
        <form
            className="divWrapper setPaddingLR"
            onSubmit={(e) => {
                e.preventDefault(); e.stopPropagation()
                save_results()
            }}
        >
            {[...all_results.entries()].map(([ids, score]) => {
                const [id1, id2] = ids.toJS()
                const user1 = users_by_id[id1]
                const user2 = users_by_id[id2]
                return (
                    <div key={`${id1}-${id2}`} style={{width: '100%', display: 'flex', alignItems: 'center'}}>
                        <div style={{flexBasis: '40%', 'flexShrink': '0', opacity: '0.8'}}>{user1.name}</div>
                        <div style={{flexBasis: '40%', 'flexShrink': '0', opacity: '0.8'}}>{user2.name}</div>
                        <input
                            className="form-control"
                            type="text"
                            style={{
                                flexBasis: '20%',
                                minWidth: '4ch',
                                fontWeight: modified_results.has(ids) ? 'bold' : 'normal',
                                fontFamily: 'monospace'
                            }}
                            value={score || ''}
                            onChange={({target: {value: new_score}}) => {
                                modify_result(ids, new_score)
                            }}
                        />
                    </div>
                )
            })}
            {did_change && (
                <Fragment>
                    <input className="btn btn-green" type="submit" value="Zapisz"/>
                    <button className="btn btn-link" onClick={revert_results}>Anuluj</button>
                </Fragment>
            )}
        </form>
    )
}



const pair_combinations = (xs) => {
    const res = []
    for (let i = 0; i < xs.length; i++) {
        for (let j = i+1; j < xs.length; j++) {
            res.push([xs[i], xs[j]])
        }
    }
    return res
}
