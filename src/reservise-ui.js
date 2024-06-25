import { add_class_reservation } from "./reservise-api";
import { VENUE_PRICE_INFO } from "./price-info";

export const refresh_popovers = () => {
  window.cleanPopovers();
  Object.values(window.calendar.reservationsById)
    .filter((e) => e.detailsPopover)
    .forEach((e) => {
      e.detailsPopover.outdate();
      e.detailsPopover.destroy();
      e.createDetailsPopover();
    });
};

export const get_current_benefit_reservation = () => {
  const today = window.calendar.date;
  const reservations = window.calendar.reservationsById;
  return find_benefit_reservation({ date: today, reservations })[0];
};

export const find_benefit_reservation = ({ reservations, date }) => {
  return Object.values(reservations).filter(
    ({ event }) =>
      event !== undefined &&
      ["class-event", "rsv-active"].every((cls) =>
        event.className.includes(cls)
      ) &&
      !event.className.includes("rsv-cancelled") &&
      event.title.search(/karty zni[zż]kowe/i) !== -1 &&
      date.isSame(event.start, "day")
  );
};

export const add_benefit_reservation = ({ client_id, benefit_res_id }) => {
  const price = "15.00";
  const price_list_id = VENUE_PRICE_INFO[window.venue.id].class_prices.benefit;
  return add_class_reservation({
    client_id,
    event_id: benefit_res_id,
    price,
    price_list_id,
  });
};

export const refetch_reservations = () =>
  window.calendar.reservationsUpdated("__some__");

const { Message } = window;

export const show_error = (msg) => {
  window.messages.appendMessage(Message.createMessage(msg, "danger"), true);
};

export const show_success = (msg) => {
  window.messages.appendMessage(Message.createMessage(msg, "success"), true);
};

export const show_critical_error = (msg) => {
  window.messages.appendMessage(Message.createMessage(msg, "critical"), true);
};
