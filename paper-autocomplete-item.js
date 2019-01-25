import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {Templatizer} from '@polymer/polymer/lib/legacy/templatizer-behavior';
/**

By default the paper-autocomplete-item would look like that:

    <paper-item>
        [[getItemString(item)]]
    </paper-item>

*/
export class PaperAutocompleteItem extends mixinBehaviors([Templatizer], PolymerElement) {

  static get is() { return 'paper-autocomplete-item' }


  static get properties() {
    return {
      /**
       * `templateClass` is the template class you obtain with this line: `Polymer.Templatize.templatize(template, dataHost);`
       *
       * @type Object
       */
      templateClass: {
        type: Object,
            observer: "_templatize"
      },
      _instance: Object,

          /**
           * `item` is the item instance from the list
           *
           * @type Object
           */
          item: Object,

        /**
         * `index` is the item index from the list
         *
         * @type Number
         */
        index: Number
    };
  }

  static get observers() {
    return [
      "_onItemChange(_instance, item, index)"
    ];
  }

  _templatize (n, o) {
      if (this._instance) return;

      let instance = new this.templateClass({});
      dom(this).appendChild(instance.root);

      this.set("_instance", instance);
  }

  _onItemChange (_instance, item, index) {
      if (_instance === undefined || item === undefined || index === undefined) return;
      this._instance.item = item;
      this._instance.index = index;
  }

}

window.customElements.define(PaperAutocompleteItem.is, PaperAutocompleteItem);
