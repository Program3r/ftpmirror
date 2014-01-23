downloads = new Meteor.Collection("downloads");
if (Meteor.isClient) {
    Template.htmldownload.events({
        'click .download': function () {
            Meteor.call('renderHtml');
        }
    })
}
if (Meteor.isServer) {
    Meteor.methods({
        'renderHtml': function () {


            downloads.remove({});
            var fiber = Meteor.require("fibers");
            var que = ftpmirrors.find({}).fetch();
            var exec = Npm.require('child_process').exec;
            exec('rm -r /root/download/storage', function (error, stdout, stderr) {
                exec('mkdir /root/download', function (error, stdout, stderr) {
                    exec('mkdir /root/download/storage', function (error, stdout, stderr) {});
                });
            });
            for (i = 0; i < que.length; i++) {
                fiber(function () {

                    var thisque = ftpmirrors.find({}).fetch()[i];

                    var fs = Meteor.require("fs.extra");
                    var Client = Meteor.require('ftp');
                    var DDPClient = Meteor.require("ddp");
                    var handlebars = Meteor.require('handlebars');
                    var ROOT = __meteor_runtime_config__.ROOT_URL;
                    var PORT = ROOT.substring(ROOT.lastIndexOf(":") + 1, ROOT.lastIndexOf("/"));
                    var ddpclient = new DDPClient({
                        host: "localhost",
                        port: PORT || 3000,
                        /* optional: */
                        auto_reconnect: true,
                        auto_reconnect_timer: 500,
                        use_ejson: true, // default is false
                        use_ssl: false, //connect to SSL server,
                        use_ssl_strict: true, //Set to false if you have root ca trouble.
                        maintain_collections: true //Set to false to maintain your own collections.
                    });
                    var reqByName = {
                        _id: thisque._id
                    };
                    for (j = 0; j < thisque.fields.length; j++) {
                        var thisfield = thisque.fields[j];
                        reqByName[thisfield.name] = thisfield;
                    }
                    ddpclient.connect(function (success) {
                        fs.readdir('/root/uploads', function (err, files) {
                            for (i = 0; i < files.length; i++) {
                                if (files[i].indexOf('.html') > -1) {

                                    var file = files[i];
                                    var filedata = fs.readFileSync('/root/uploads/' + files[i], 'utf8');
                                    var template = handlebars.compile(filedata);
                                    var rendered = template({
                                        site: 'http://' + reqByName.Hostname.value + reqByName["Web Root"].value
                                    });
                                    fs.writeFile("/root/download/storage/" + reqByName["Name"].value+".html", rendered, function (err) {


                                                            ddpclient.call('addDownload', [reqByName["Name"].value+".html"])

                                    })
                                }
                            }

                        });


                    });
                }).run();
            }
        },
        'addDownload':function(filename){
            downloads.insert({filename:filename});
        }
    });
}
if(Meteor.isClient){
    Template.htmldownload.downloads = function(){
        return downloads.find({});
    }
    Template.htmldownload.host = function(){
        return "http://"+window.location.hostname+":3555";
    }
}