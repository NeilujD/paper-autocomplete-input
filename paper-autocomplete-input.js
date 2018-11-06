import './paper-autocomplete-item.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-material/paper-material';
import '@polymer/paper-progress/paper-progress';
import '@polymer/paper-item/paper-item';
import '@polymer/iron-ajax/iron-ajax';
import '@polymer/paper-input/paper-input';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {templatize} from '@polymer/polymer/lib/utils/templatize';
import {IronFormElementBehavior} from "@polymer/iron-form-element-behavior/iron-form-element-behavior";
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import './paper-autocomplete-item'

/**
 paper-input with personalizable autocompletion feature

 Example:

 <paper-autocomplete-input
 label="Autocompleting input"
 autoc-url="data.json"
 autoc-fields='["name"]'></paper-autocomplete-input>

 The element will request the given url with the `value` parameter.
 This one contain the typed input value that used to filter your items.
 Your server should respond with a JSON array of items like following:

 [
 {"name": "John Lenon", "color": "orange", "fruit": "banana"},
 {"name": "Vol Demor", "color": "black", "fruit": "pineapple"},
 {"name": "Han Solo", "color": "green", "fruit": "potato"},
 ...
 ]

 Then, you specify which field you want to watch to autocomplete the input value using the `autoc-fields` array attribute.

 To get the selected item the `item-selected` event is fired :

 <paper-autocomplete-input
 label="Autocompleting input"
 autoc-url="data.json"
 autoc-fields='["name"]'
 on-item-selected="onItemSelected"></paper-autocomplete-input>

 ...

 onItemSelected: function (e, detail) {
        var mySelectedItem = detail;
    }

 You also can specify you own item template so you can customize as you want your item list.

 <paper-autocomplete-input
 autoc-url="data.json"
 label="Custom autocompletion input"
 autoc-fields='["name"]'>
 <template>
 <paper-item>
 <paper-item-body two-line>
 <div>[[item.first_name]] - [[item.last_name]]</div>
 <div secondary>This is the number [[index]]</div>
 </paper-item-body>
 <iron-icon icon="perm-identity"></iron-icon>
 </paper-item>
 </template>
 </paper-autocomplete-input>

 The following custom properties and mixins are also available for styling:

 Custom property | Description | Default
 ----------------|-------------|----------
 `--paper-autocomplete-input-list-margin-top` | Margin top from the item list | 2px
 `--paper-autocomplete-item` | Mixin for the item | {}
 `--paper-autocomplete-input-list-background` | List background | white

 @group Paper Elements
 @demo demo/index.html
 @element paper-autocomplete-input
 */
export class PaperAutocompleteInput extends mixinBehaviors([IronFormElementBehavior], PolymerElement) {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
        position: relative;
      }
      paper-input {
        width: 100%;
        --paper-input-container: {
          padding-bottom: 0;
        };
      }
      paper-autocomplete-item {
        cursor: pointer;
        position: relative;
        background-color: white;
        @apply --paper-autocomplete-item;
      }
      paper-autocomplete-item:not(:last-of-type) {
        border-bottom: solid 1px var(--divider-color);
      }
      paper-autocomplete-item:last-of-type {
        border-radius: 0 0 2px 2px;
      }
      paper-autocomplete-item:focus:before {
        display: none;
      }
      paper-autocomplete-item.selected {
        background-color: var(--divider-color);
      }
      [hidden] {
        display: none !important;
      }
      #itemListDiv {
        position: absolute;
        overflow: visible;
        -webkit-overflow-scrolling: touch;
        min-width: 100%;
        margin-top: var(--paper-autocomplete-input-list-margin-top, 2px);
        background-color: white;
        z-index: 10;
      }
      #itemListDiv div {
        width: 100%;
      }
      #itemListDiv div paper-material {
        overflow: visible;
        -webkit-overflow-scrolling: touch;
        border-radius: 0 0 2px 2px;
        background: var(--paper-autocomplete-input-list-background, white);
        width: 100%;
      }
      paper-progress {
        width: 100%;
        position: absolute;
      }
    </style>

    <iron-ajax id="getAutocItemsRequest" url="{{ autocUrl }}" loading="{{suggestionsLoading}}" last-response="{{ items }}" on-response="_onAutocItemsResponse"></iron-ajax>

    <paper-input id="input" label="[[label]]" value="{{value}}" disabled="[[disabled]]" invalid="{{invalid}}" allowed-pattern="[[allowedPattern]]" type="[[type]]" pattern="[[pattern]]" required="[[required]]" error-message="[[errorMessage]]" char-counter="[[charCounter]]" no-label-float="[[noLabelFloat]]" always-float-label="[[alwaysFloatLabel]]" autovalidate="[[autoValidate]]" validator="[[validator]]" autofocus="[[autofocus]]" inputmode="[[inputmode]]" name="[[name]]" placeholder="[[placeholder]]" readonly="[[readonly]]" on-keyup="_onKeyUp" on-focusout="_onFocusOut" focused="{{focused}}">
      <slot name="prefix" slot="prefix"></slot>
      <slot name="suffix" slot="suffix"></slot>
    </paper-input>

    <div id="itemListDiv">
      <template is="dom-if" if="[[!hideLoadingBar]]">
        <paper-progress indeterminate="[[suggestionsLoading]]" hidden="[[!suggestionsLoading]]"></paper-progress>
      </template>
      <div>
        <paper-material elevation="3" hidden="[[ _hideResults ]]">
          <template id="itemListTemplate" is="dom-repeat" items="[[ filteredItems ]]">
            <paper-autocomplete-item on-tap="_onItemTap" class\$="[[ _isKeySelectedItemClass(item, _keySelectedItem) ]]" template-class="[[_itemTemplateClass]]" item="[[item]]" index="[[index]]"></paper-autocomplete-item>
          </template>
        </paper-material>
      </div>
    </div>

    <template id="defaultTemplate">
      <paper-item>
        [[ getItemString(item) ]]
      </paper-item>
    </template>
`;
  }

  static get is() { return 'paper-autocomplete-input'; }

/*  behaviors: [
      Polymer.IronFormElementBehavior
  ],*/

  static get properties() {
    return {
    /**
     * The label for this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * `<label>`'s content and `hidden` property, e.g.
     * `<label hidden$="[[!label]]">[[label]]</label>` in your `template`
     */
    label: {
      type: String
    },

    /**
     * The value for this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<iron-input>`'s `bindValue`
     * property, or the value property of your input that is `notify:true`.
     */
    value: {
      notify: true,
      type: String
    },

    /**
     * Set to true to disable this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * both the `<paper-input-container>`'s and the input's `disabled` property.
     */
    disabled: {
      type: Boolean,
      value: false
    },

    /**
     * Returns true if the value is invalid. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to both the
     * `<paper-input-container>`'s and the input's `invalid` property.
     *
     * If `autoValidate` is true, the `invalid` attribute is managed automatically,
     * which can clobber attempts to manage it manually.
     */
    invalid: {
      type: Boolean,
      value: false,
      notify: true
    },

    /**
     * Set this to specify the pattern allowed by `preventInvalidInput`. If
     * you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `allowedPattern`
     * property.
     */
    allowedPattern: {
      type: String
    },

    /**
     * The type of the input. The supported types are `text`, `number` and `password`.
     * If you're using PaperInputBehavior to implement your own paper-input-like element,
     * bind this to the `<input is="iron-input">`'s `type` property.
     */
    type: {
      type: String
    },

    /**
     * A pattern to validate the `input` with. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `pattern` property.
     */
    pattern: {
      type: String
    },

    /**
     * Set to true to mark the input as required. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `required` property.
     */
    required: {
      type: Boolean,
      value: false
    },

    /**
     * The error message to display when the input is invalid. If you're using
     * PaperInputBehavior to implement your own paper-input-like element,
     * bind this to the `<paper-input-error>`'s content, if using.
     */
    errorMessage: {
      type: String
    },

    /**
     * Set to true to show a character counter.
     */
    charCounter: {
      type: Boolean,
      value: false
    },

    /**
     * Set to true to disable the floating label. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `noLabelFloat` property.
     */
    noLabelFloat: {
      type: Boolean,
      value: false
    },

    /**
     * Set to true to always float the label. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `alwaysFloatLabel` property.
     */
    alwaysFloatLabel: {
      type: Boolean,
      value: false
    },

    /**
     * Set to true to auto-validate the input value. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<paper-input-container>`'s `autoValidate` property.
     */
    autoValidate: {
      type: Boolean,
      value: false
    },

    /**
     * Name of the validator to use. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `validator` property.
     */
    validator: {
      type: String
    },

    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autofocus` property.
     */
    autofocus: {
      type: Boolean,
      observer: '_autofocusChanged'
    },

    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `inputmode` property.
     */
    inputmode: {
      type: String
    },

    /**
     * The minimum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `minlength` property.
     */
    minlength: {
      type: Number
    },

    /**
     * The maximum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `maxlength` property.
     */
    maxlength: {
      type: Number
    },

    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `name` property.
     */
    name: {
      type: String
    },

    /**
     * A placeholder string in addition to the label. If this is set, the label will always float.
     */
    placeholder: {
      type: String,
      // need to set a default so _computeAlwaysFloatLabel is run
      value: ''
    },

    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `readonly` property.
     */
    readonly: {
      type: Boolean,
      value: false
    },

    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocapitalize` property.
     */
    autocapitalize: {
      type: String,
      value: 'none'
    },

    /**
     * `items` is the item list resulting by the autocompleting filter.
     *
     * @type Array
     */
    items: {
      type: Array,
      observer: "_onItemsChange"
    },

    /**
     * `filteredItems` is the list of items client side filtered and sorted.
     *
     * @type Array
     */
    filteredItems: {
      type: Array,
      notify: true,
      readOnly: true
    },

    /**
     * `autocUrl` is the url to request to get the autocompleting data.
     *
     * @type String
     */
    autocUrl: String,

    /**
     * `autocFields` is the list of fields from it should get the autocompleting data.
     *
     * @type Array
     */
    autocFields: {
      type: Array
    },

    _hideResults: {
      type: Boolean,
      value: true,
      observer: '_onHideResultsChange'
    },

    /**
     * `_keySelectedItem` is the item selected by the arrow keys.
     *
     * @type: Object
     */
    _keySelectedItem: {
      type: Object,
      notify: true,
      value: null
    },

    /**
     * `selectedItem` is the item selected from the input.
     *
     * @type Object
     */
    selectedItem: {
      type: Object,
      observer: '_onSelectedItemChange',
      notify: true
    },

    /**
     * `params` is the params you want to send to the server for filtering purpose.
     *
     * @type Object
     * @default {}
     */
    params: {
      type: Object,
      value: function () { return {}; }
    },

    /**
     * `displayListOnFocus` permit to display the list even if the have not typed anything yet
     *
     * @type Boolean
     * @default false
     */
    displayListOnFocus: {
      type: Boolean,
      value: false,
      notify: true
    },

    /**
     * `focused` permit to know if the input is on focus or not.
     *
     * @type Boolean
     * @default false
     */
    focused: {
      type: Boolean,
      value: false,
      observer: "_onFocusedChanged"
    },

    /**
     * `suggestionsLoading` notify when the input is currently loading to retrieve suggestions
     *
     * @type Boolean
     * @readOnly
     */
    suggestionsLoading: {
      type: Boolean,
      value: false
    },

    _itemTemplate: Object,

    /**
     * Template for the autocomplete item
     *
     * @type Object
     * @readOnly
     */
    _itemTemplateClass: Object,

    /**
     * permit to hide the loading bar
     *
     * @type Boolean
     * @default false
     */
    hideLoadingBar: {
      type: Boolean,
      value: false,
      notify: true
    },

    /**
     * start the request after a timeout of non user activity in the input
     */
    timeout: {
        type: Number,
        value: 0
    },

    _timeout: Number,

    /**
     * `firstRequestStart` is the character's count after the first request is started
     */
    firstRequestStart: {
        type: Number,
        value: 0
    }
  };
  }

  ready() {
    super.ready();
    var template = dom(this).querySelector('template:not(#defaultTemplate)');
    var dataHost = this;

    if (!template) {
        template = this.$.defaultTemplate;
    }

    this.set("_itemTemplate", template);
    this.set("_itemTemplateClass", templatize(template, dataHost));
  }

  _onItemTap(e, detail) {
    this.set('selectedItem', e.model.item);
  }

  /**
   * The `_getFilteredItems` permit to return the filtered items.
   */
  _getFilteredItems() {
    var that = this;
    var r = RegExp(this.value, 'i');

    var filteredItems = this.items.filter(function(item) {
      var item_string = that.getItemString(item);
      return r.test(item_string);
    });

    return filteredItems;
  }

  /**
   * The `_onAutocItemsResponse` is used when the autocompleting items request has been responded.
   *
   * @private
   */
  _onAutocItemsResponse() {
    this.fire("autoc-items-change", this.items);
  }

  /**
   * The `_onKeyUp` event is used when the input value changes by typing in it or when the user pressed the ESC key.
   *
   * @param e
   * @param detail
   */
  _onKeyUp(e, detail) {
    if (e.keyCode === 40) {
      this.selectNextItem();
      return;
    }
    if (e.keyCode === 38) {
      this.selectPreviousItem();
      return;
    }
    if (e.keyCode === 13) {
      this.set('selectedItem', this._keySelectedItem || this.filteredItems[0]);
      return;
    }
    if (e.keyCode == 27) {
      this.$.input.blur();
      return;
    }

    this.value = this.value || "";

    if (this.value.length < this.firstRequestStart) return;

    var that = this;

    if (!this.autocUrl) {
      if (!!this.items) this._udpateFilteredItems();
      return;
    }

    if (this.timeout > 0) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(function () {
        that.loadList();
      }, this.timeout);
      return;
    }

    this.loadList();
  }

  /**
   * The `selectNextItem` method is used to select the next item in the list
   */
  selectNextItem() {
    if (!this.filteredItems.length > 0) {
      return;
    }

    var currentIndex = this.filteredItems.indexOf(this._keySelectedItem);

    if (!this._keySelectedItem || currentIndex === -1) {
      this.set('_keySelectedItem', this.filteredItems[0]);
      return;
    }

    var nextIndex = currentIndex < this.filteredItems.length - 1 ? currentIndex + 1 : currentIndex;
    this.set('_keySelectedItem', this.filteredItems[nextIndex]);
  }

  /**
   * The `selectPreviousItem` method is used to select the previous item in the list
   */
  selectPreviousItem() {
    if (!this.filteredItems.length > 0) {
      return;
    }

    var currentIndex = this.filteredItems.indexOf(this._keySelectedItem);

    if (!this._keySelectedItem || currentIndex === -1) {
      this.set('_keySelectedItem', this.filteredItems[0]);
      return;
    }

    var nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    this.set('_keySelectedItem', this.filteredItems[nextIndex]);
  }

  /**
   * The `_onSelectedItemChange` is used when the selected item change.
   */
  _onSelectedItemChange(n, o) {
    if (n === undefined) return;
    this.value = this.getItemString(n);
    if (n) {
      this._hideResults = true;
      this.$.input.blur();
      if (this.autocUrl) this.set('items', null);
    }
    this.fire("item-selected", n);
  }

  /**
   * The `item-selected` event is fired when an item is selected.
   *
   * @event item-selected
   */

  /**
   * The `_onItemsChange` the item list is sorted and the filtered items is set.
   */
  _onItemsChange(n, o) {
    if (!this.items) {
      return;
    }
    var that = this;
    this.set("items", this.items.sort(function (item1, item2) {
      var item1_string = that.getItemString(item1);
      var item2_string = that.getItemString(item2);
      if (item1_string < item2_string) {
        return -1;
      }
      else if (item1_string > item2_string) {
        return 1;
      }
      else {
        return 0;
      }
    }));
    this._udpateFilteredItems();
  }

  /**
   * `_udpateFilteredItems` permit to update the list of filtered items.
   */
  _udpateFilteredItems() {
    this._setFilteredItems(this.displayListOnFocus && !this.value ? this.items : this._getFilteredItems());
    this._hideResults = !((this.value || this.displayListOnFocus) && this.focused);
    this.fire("items-change", {"items": this.items, "filtered_items": this.filteredItems});
  }

  /**
   * The `items-change` event is fired when the item list change.
   *
   * @event items-change
   */

  /**
   * The `_onFocusOut` is used when the user leaves the focus.
   */
  _onFocusOut(e) {
    e.preventDefault();

    this.async(function () {
      if (this.value === "" || this.value === null) {
        this.selectedItem = null;
      }

      this.cancelTyping();
    }, 100);

    return false;
  }

  _onFocusedChanged(n, o) {
    if (!n) {
      return;
    }

    if (!this.displayListOnFocus) {
      return;
    }

    this.loadList();
  }

  /**
   * The `loadList` method permit to load the autocompletion item list send the current input value and params.
   */
  loadList() {
    var p = {
      "value": this.value,
      "params": JSON.stringify(this.params)
    };

    this.$.getAutocItemsRequest.params = p;
    this.$.getAutocItemsRequest.generateRequest();
  }

  /**
   * The `cancelTyping` method permit to cancel the current typing action.
   */
  cancelTyping() {
    this.value = this.getItemString(this.selectedItem);
    this._hideResults = true;
    this.fire("typing-cancelled", this.value);
  }

  /**
   * The `typing-cancelled` event is fired when the cancelTyping` method is called`
   *
   * @event typing-cancelled
   */

  /**
   * The `reset` method permit to clear the input and the selected item.
   */
  reset() {

    this.selectedItem = null;
    this.items = null;
    this.value = null;
  }

  /** The `_isKeySelectedItemClass` method return "selected" if the given item is selected by keys.
   *
   * @param item
   * @param _keySelectedItem
   * @returns {string}
   * @private
   */
  _isKeySelectedItemClass(item, _keySelectedItem) {
    return item == _keySelectedItem ? "selected" : "";
  }

  _onHideResultsChange(n, o) {
    console.log()
    if (n === undefined) return;
    if (n) {
      return;
    }
    this.set('_keySelectedItem', null);
  }

  /**
   * Permit to retrieve the item string based on the autocFields property
   *
   * @param item
   * @returns {string}
   */
  getItemString(item) {
    if (!this.autocFields) {
      return null;
    }
    if (!item) {
      return null;
    }
    var item_string = "";
    for (var i = 0; i < this.autocFields.length; i++) {
      if (!item[this.autocFields[i]]) {

        continue;
      }
      item_string += item[this.autocFields[i]];
      if (i < this.autocFields.length - 1 && item[this.autocFields[i + 1]]) {
        item_string += " - ";
      }
    }
    return item_string;
  }
}

window.customElements.define(PaperAutocompleteInput.is, PaperAutocompleteInput);
