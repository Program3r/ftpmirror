uploadque = new Meteor.Collection('uploadque');
if (Meteor.isServer) {
    Meteor.methods({
        'uploadAll': function () {
            uploadque.remove({});
            var fiber = Meteor.require("fibers");
            var workingsites = ftpmirrors.find({
                status: "PASS"
            }).fetch();
            for (i = 0; i < workingsites.length; i++) {
                delete workingsites[i]._id;
                uploadque.insert(workingsites[i]);
            }
            var que = uploadque.find({}).fetch();
            for (i = 0; i < que.length; i++) {
                fiber(function () {

                    var thisque = uploadque.find({}).fetch()[i];

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

                        var c = new Client();
                        c.on('ready', function () {
                            fs.readdir('/root/uploads', function (err, files) {
                                for (i = 0; i < files.length; i++) {
                                    if (files[i].indexOf('.css') > -1 || files[i].indexOf('.html') > -1) {

                                        var file = files[i];
                                        var filedata = fs.readFileSync('/root/uploads/' + files[i], 'utf8');
                                        var template = handlebars.compile(filedata);
                                        var rendered = template({
                                            site: 'http://' + reqByName.Hostname.value + reqByName["Web Root"].value
                                        });


                                        c.put(rendered, reqByName["Upload Directory"].value + files[i], function (err) {

                                            ddpclient.call('updateProgress', [reqByName._id, (100 / files.length) * (i + 1)])
                                        })
                                    }
                                    else {
                                        c.put("/root/uploads/" + files[i], reqByName["Upload Directory"].value + files[i], function (err) {

                                            ddpclient.call('updateProgress', [reqByName._id, (100 / files.length) * (i + 1)])
                                        })

                                    }
                                }

                            });
                        });
                        c.on('error', function (err) {
                            console.log("ERROR");

                        });


                        c.connect({
                            host: reqByName.Hostname.value,
                            user: reqByName.Username.value,
                            password: reqByName.Password.value,
                            port: 21
                        });
                    });
                }).run();
            }
        },
        'updateProgress': function (id, progress) {
            uploadque.update(id, {
                $set: {
                    progress: progress
                }
            });
        }
    });
}
if (Meteor.isClient) {
    Template.uploadque.events({
        'click .uploadall': function () {
            Meteor.call('uploadAll');
        }
    });
    Template.uploadque.inque = function () {
        return uploadque.find({});
    }
    Template.progress.fields = function () {
        var reqByName = {};
        for (i = 0; i < this.fields.length; i++) {
            var thisfield = this.fields[i];
            reqByName[thisfield.name] = thisfield;
        }
        console.log(reqByName)
        return reqByName;

    }
    Template.uploadque.name = function () {
        for (i = 0; i < this.length; i++) {
            if (this[i].name == "Name") {
                return this[i].name;
            }
        }
    }
}