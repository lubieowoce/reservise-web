import React, { Fragment, useMemo } from "react";
import { uniqBy, noop } from "lodash";

import {
  GameResults,
  replaceUser,
  removeResultsWithUser,
} from "./game-results-widget";
import { AddClient } from "./add-client-widget";
import { Collapsible, useToggle } from "./collapsible";

export const ClientData = ({
  user_entries,
  game_results,
  reservation_owner,
  onChange,
}) => {
  // console.log('<ClientData>', {user_entries, game_results, reservation_owner})
  const [isOpen, toggleIsOpen] = useToggle(false);
  const users = useMemo(
    () =>
      usersFromEntries({ reservation_owner, user_entries }).map((u) =>
        u.name ? u : { ...u, name: u.label.replace(/\s\([+0-9]+\)/, "") }
      ),
    [reservation_owner, user_entries]
  );

  const onAddEntry = (entry) => {
    const new_user_entries = [...user_entries, entry];
    onChange({ user_entries: new_user_entries });
  };

  const onRemoveEntry = (index) => {
    const new_user_entries = remove_index([...user_entries], index);
    const changed = { user_entries: new_user_entries };

    // if this removes a user, remove their scores
    const removedUserId = user_entries[index].user.id;
    const newUserIds = userIdsFromEntries({
      reservation_owner,
      user_entries: new_user_entries,
    });
    if (!newUserIds.includes(removedUserId)) {
      changed.game_results = removeResultsWithUser(game_results, {
        id: removedUserId,
      });
    }

    onChange(changed);
  };

  const onModifyEntry = (index, entry) => {
    const new_user_entries = [...user_entries];
    new_user_entries[index] = entry;
    const changed = { user_entries: new_user_entries };

    // check if the new user replaces the old
    // i.e. no entries with oldUserId remain after this change
    // if so, make the old user's results belong to the new user
    const oldUserId = user_entries[index].user.id;
    const newUserId = entry.user.id;
    if (oldUserId !== newUserId) {
      const newUserIds = userIdsFromEntries({
        reservation_owner,
        user_entries: new_user_entries,
      });
      if (!newUserIds.includes(oldUserId)) {
        changed.game_results = replaceUser(game_results, {
          oldId: oldUserId,
          newId: newUserId,
        });
      }
    }
    // const new_results = replaceUser(game_results, {oldId, newId})
    onChange(changed);
  };

  const onResultsChanged = (new_game_results) => {
    onChange({ game_results: new_game_results });
  };

  return (
    <Fragment>
      <AddClient
        user_entries={user_entries}
        reservation_owner={reservation_owner}
        onAddEntry={onAddEntry}
        onRemoveEntry={onRemoveEntry}
        onModifyEntry={onModifyEntry}
      />
      <Collapsible
        className="collapsible-outlined-tb"
        content={
          <span style={{ color: "#cacaca" }}>
            Wyniki {game_results.length > 0 && `(${game_results.length})`}
          </span>
        }
        isOpen={isOpen}
        onToggle={toggleIsOpen}
      >
        <GameResults
          users={users}
          game_results={game_results}
          onChange={onResultsChanged}
        />
      </Collapsible>
    </Fragment>
  );
};

ClientData.style = [AddClient.style, Collapsible.style].join("\n");

const remove_index = (xs, i) => {
  xs.splice(i, 1);
  return xs;
};

const userIdsFromEntries = ({ reservation_owner, user_entries }) =>
  usersFromEntries({ reservation_owner, user_entries }).map(({ id }) => id);

const usersFromEntries = ({ reservation_owner, user_entries }) =>
  uniqBy([reservation_owner, ...user_entries.map(({ user }) => user)], "id");
