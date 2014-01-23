if (Meteor.isServer) {
    Meteor.methods({
        'testFtpConnection': function(site) {
            var reqByName = {};
            for (i = 0; i < site.fields.length; i++) {
                var thisfield = site.fields[i];
                reqByName[thisfield.name] = thisfield;
            }

                var Client = Meteor.require('ftp');
                var fs = Meteor.require('fs');
                var DDPClient = Meteor.require("ddp");
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

                console.log(reqByName)
                ddpclient.connect(function(success) {
                    var c = new Client();
                    c.on('ready', function() {
                        ddpclient.call('processTestResults', [{_id:site._id, code:'PASS'}]);
                    });
                    c.on('error', function(err) {
                        console.log(err.code)
                        ddpclient.call('processTestResults', [{_id:site._id, code:err.code}]);

                    });


                    c.connect({
                        host: reqByName.Hostname.value,
                        user: reqByName.Username.value,
                        password: reqByName.Password.value,
                        port:21
                    });
                });
        },
        'processTestResults': function(data) {
            ftpmirrors.update({_id:data._id},{$set:{status:data.code}});
        }
    });
}