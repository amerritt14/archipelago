React = require('react')
ArchipelagoPane  = require('./archipelago_pane')

module.exports =
class ArchipelagoPaneList extends React.Component
  render: ->
    React.createElement(
      'archipelago-pane-list',
      null,
      @props.tabs.map (tabObject) =>
        React.createElement(
          ArchipelagoPane, {
            id: tabObject.id,
            key: tabObject.id,
            currentTab: @props.currentTab,
            changeTitle: @props.changeTitle,
            markUnread: @props.markUnread,
            removeTab: @props.removeTab
          }
        )
    )
