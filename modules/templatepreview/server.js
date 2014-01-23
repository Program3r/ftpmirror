if (Meteor.isServer) {
    Meteor.methods({
        'generatePreview': function(location) {
            var fs = Npm.require("fs.extra");
            var exec = Npm.require('child_process').exec;
            var handlebars = Meteor.require('handlebars');
            var ROOT = __meteor_runtime_config__.ROOT_URL;
            exec('rm -r /root/preview', function(error, stdout, stderr) {
                exec('mkdir /root/preview', function(error, stdout, stderr) {
                    fs.readdir('/root/uploads', function(err, files) {
                        for (i = 0; i < files.length; i++) {
                            if (files[i].indexOf('.css') > -1 || files[i].indexOf('.html') > -1) {
                                console.log("Discovered Dynamic File " + files[i]);
                                var file = files[i];
                                var filedata = fs.readFileSync('/root/uploads/' + files[i], 'utf8');
                                var template = handlebars.compile(filedata);
                                var rendered = template({site:'http://'+location.hostname+":3555/preview"});
                                fs.writeFileSync('/root/preview/'+file, rendered);
                            }
                            else {
                                exec('cp /root/uploads/' + files[i] + ' /root/preview', function(error, stdout, stderr) {
                                    console.log([error, stdout, stderr])
                                });
                                console.log("Discovered Static File " + files[i]);
                            }
                        }
                    });
                });
            });
        }
    });
}
if (Meteor.isClient) {
    Template.sites.events({
        'click .preview': function() {
            Meteor.call('generatePreview', window.location);
        }
    });
    Template.preview.previewloc = function(){
        return window.location.href.replace(window.location.port, '3555/preview');

    }
}