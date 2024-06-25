const { jQuery: $ } = window;

const setInputValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const addPasteInput = () => {
  const pasteInput = document.createElement("input");
  const CLS = "reservise-user-input";
  const el = $(`
        <div
            style="
                font-size: 0.8em;
                background: white;
                border: 1px solid lightgray;
                padding: 0.7em;
                box-shadow: 0 10px 10px rgba(0,0,0, 0.1); 
            "
        >
            <span>Wklej dane zawodnika (<kbd>Ctrl</kbd> + <kbd>V</kbd>)</span>
            <input
                type="text"
                class="${CLS} form-control input-sm"
                placeholder="dane zawodnika"
                title="Wklej w to pole dane zawodnika skopiowane przyciskiem z listy graczy." 
            />
        </div>
    `)[0];

  el.querySelector(`input.${CLS}`).addEventListener("paste", (event) => {
    event.preventDefault();
    const form = document.querySelector(
      'form[ng-model="model.add_new_player_form"]'
    );
    const inputs = {
      first_name: form.querySelector('input[ng-model="model.imie"]'),
      last_name: form.querySelector('input[ng-model="model.nazwisko"]'),
      email: form.querySelector('input[ng-model="model.email"]'),
      phone_number: form.querySelector('input[ng-model="model.telefon"]'),
    };
    const playerText = (event.clipboardData || window.clipboardData).getData(
      "text"
    );

    if (!playerText) {
      return;
    }
    try {
      const player = JSON.parse(playerText);
      if (typeof player !== "object") {
        return;
      }
      Object.entries(inputs).forEach(([field_name, input]) => {
        setInputValue(input, player[field_name] || "");
      });
    } catch (err) {
      console.error(err);
    }
  });

  $(el).css({ position: "fixed", top: "45px", right: "5px" });
  document.body.appendChild(el);
  console.log("injected input", pasteInput);
};

$(document).ready(() => {
  addPasteInput();
});
