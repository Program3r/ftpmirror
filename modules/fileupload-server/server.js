resources = new Meteor.Collection('resources');
if (Meteor.isServer) {
    Meteor.startup(function() {
        var express = Meteor.require('express');
        var exec = Npm.require('child_process').exec;
        exec('mkdir /root/preview');
        exec('mkdir /root/uploads');
        exec('mkdir /root/download');
        exec('mkdir /root/download/storage');
        var app = express();
        app.use(express.bodyParser());
        app.use('/preview',express.static('/root/preview'));
        app.use('/download',express.static('/root/download'));
        app.post('/upload', function(req, res) {
            var fs = Npm.require('fs.extra');
            var unzip = Meteor.require('unzip');
            var DDPClient = Meteor.require("ddp");

            var rmdir = Meteor.require('rimraf');
            var ROOT = __meteor_runtime_config__.ROOT_URL;
            var PORT = ROOT.substring(ROOT.lastIndexOf(":") + 1, ROOT.lastIndexOf("/"));
            var exec = Npm.require('child_process').exec;
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
            res.send("<script>window.history.back();</script>")
            ddpclient.connect(function(success) {
                exec('rm -r /root/uploads', function(error, stdout, stderr) {
                    console.log("Removed /root/uploads");
                    console.log([error, stdout, stderr])
                    exec('mkdir /root/uploads', function(error, stdout, stderr) {

                        console.log("Added /root/uploads");
                        console.log([error, stdout, stderr])
                        fs.readFile(req.files.zipfile.path, function(err, data) {
                            var newPath = "/root/uploads/" + req.files.zipfile.originalFilename;
                            fs.writeFile(newPath, data, function(err) {
                                console.log('Finished Upload');
                                fs.createReadStream(newPath).pipe(unzip.Extract({
                                    path: "/root/uploads/"
                                })).on('close', function() {
                                    console.log("Finished Extraction");
                                    exec("rm " + newPath, function(error, stdout, stderr) {
                                        console.log([error, stdout, stderr])
                                        console.log("Deleted Zip File");
                                        ddpclient.call('clearResources');
                                        console.log("Cleared Cache")
                                        fs.readdir('/root/uploads', function(err, files) {
                                            for (i = 0; i < files.length; i++) {
                                                ddpclient.call('addResource', [{
                                                    'filename': files[i]
                                                }]);
                                                console.log("Added" + files[i])
                                            }

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

        });
        app.listen(3555);
    });
}
if (Meteor.isServer) {
    Meteor.methods({
        'addResource': function(resource) {
            resources.insert(resource);
            return true;
        },
        'clearResources': function() {
            resources.remove({});
            return true;
        }
    });
}
if (Meteor.isClient) {
    Template.fileupload.resources = function() {
        return resources.find({});
    }
}