const BaseField = require(join(__dirname, '/base_field'))
const nestedProperty = require('nested-property')

class ProfileSelectorField extends BaseField {
  constructor(id) {
    super()
    this.dataset['id'] = this.dataset.id || id

    this.setInnerHTML()
  }

  setInnerHTML() {
    let mdcRadio = document.createElement('div')
    mdcRadio.classList = 'mdc-radio'

    mdcRadio.append(this._input())
    mdcRadio.append(this._background())

    this.append(mdcRadio)
  }

  attachListeners() {
    this.input.addEventListener('change', () => {
      let checked = document.querySelector('profile-selector-field input:checked').id
      this.updateSetting('activeProfile', checked)
    })
  }

  _input() {
    this.input = document.createElement('input')
    this.input.setAttribute('name', 'activeProfile')
    this.input.setAttribute('type', 'radio')
    this.input.setAttribute('id', this.dataset.id)
    this.input.setAttribute('class', 'mdc-radio__native-control')
    if (nestedProperty.get(this.currentSettings(), 'activeProfile') == this.dataset.id) {
      this.input.setAttribute('checked', true)
    }

    return this.input
  }

  _background() {
    let background = document.createElement('div')
    background.classList = 'mdc-radio__background'
    let outer = document.createElement('div')
    outer.classList = 'mdc-radio__outer-circle'
    let inner = document.createElement('div')
    inner.classList = 'mdc-radio__inner-circle'

    background.append(outer)
    background.append(inner)

    return background
  }
}

module.exports = ProfileSelectorField
window.customElements.define('profile-selector-field', ProfileSelectorField)
