if (Meteor.isClient) {
    Meteor.startup(function() {
        $(".help").popover();
    });
}