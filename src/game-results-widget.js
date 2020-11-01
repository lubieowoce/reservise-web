import React, {useState} from 'react'

import { sortBy, keyBy } from 'lodash'
import {
	List as IList,
	Map as IMap,
	fromJS as immFromJS,
} from 'immutable'

const results_from_JS = (results) => IMap(results.map(([ids, result]) => [IList(ids), result]))
const results_to_JS = (results) => [...results.entries()].map(([ids, r]) => [ids.toJS(), r])

export const GameResults = ({game_results, users, onChange}) => {
	users = users.map((u) => u.name ? u : {...u, name: u.label.replace(/\s\([+0-9]+\)/, '')})
	const user_ids = sortBy(users, 'name').map(({id}) => id)
	const users_by_id = keyBy(users, 'id')

	game_results = results_from_JS(game_results)

	const [modified_results, set_modified_results] = useState(IMap())
	const did_change = modified_results.count() > 0
	const all_results = (
		IMap(pair_combinations(user_ids).map((ids) => [IList(ids), null]))
		.merge(game_results)
		.merge(modified_results)
	)

	const modify_result = (ids, result) => {
		if (game_results.get(ids) === result) { return }
		set_modified_results(modified_results.set(ids, result))
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
				console.log('result entry', ids.toJS(), score)
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
							style={{flexBasis: '20%', minWidth: '4ch'}}
							value={score || ''}
							onChange={({target: {value: new_score}}) => {
								modify_result(ids, new_score)
							}}
						/>
					</div>
				)
			})}
			{did_change &&
				<input className="btn btn-green" type="submit" value="zapisz"/>
			}
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
