import React from "react";

const noop = () => {};

import { Collapsible, useToggle } from "./collapsible";

export const CardList = ({
  userEntries,
  className = "",
  onShowReservation = noop,
  onSyncCards = noop,
}) => {
  const userEntriesWithCard = userEntries.filter((entry) => entry.card);
  const [isOpen, toggleOpen] = useToggle(false);

  const makeEntry = ({ event_id, user: { id, label } }, i) => (
    <div
      key={`${event_id}-${id}-${i}`}
      className="card-list__entry"
      style={{ display: "flex", justifyContent: "space-between" }}
    >
      <a
        href={`/clients/c/${id}/`}
        style={{ overflow: "hidden" }}
        target="blank"
      >
        {label}
      </a>
      <a
        href="#"
        title="otwórz rezerwację"
        onClick={(e) => {
          e.preventDefault();
          onShowReservation(event_id);
        }}
      >
        <span className="glyphicon glyphicon-calendar" />
      </a>
    </div>
  );

  return (
    <div className={`card-list ${className}`}>
      <Collapsible
        isOpen={isOpen}
        onToggle={toggleOpen}
        className="collapsible-outlined"
        content={
          <span>
            Karty zniżkowe (<strong>{userEntriesWithCard.length}</strong>)
          </span>
        }
      >
        <div style={{ padding: "1em" }}>
          {userEntriesWithCard.map(makeEntry)}
        </div>
        <button
          className="btn"
          style={{ display: "block", width: "100%" }}
          onClick={onSyncCards}
        >
          <span className="glyphicon glyphicon-refresh"></span>
          Synchronizuj karty
        </button>
      </Collapsible>
    </div>
  );
};

CardList.style = `
.card-list__entry + .card-list__entry {
    margin-top: 0.5em;
}
`;
