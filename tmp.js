ftpmirrors = new Meteor.Collection('ftpmirrors')

if (Meteor.isClient) {
    Template.sites.site=function(){
        return ftpmirrors.find();
    };
    Template.sites.testclass = function(){
        switch(this.status){
            case 'ECONNREFUSED':
                return 'btn-danger'
                break;
            case 'PASS':
                return 'btn-success'
                break;
            case 530:
                return 'btn-danger'
                break;
            default:
                return 'btn-warning'
                break;
        }
    }
    Template.sites.testicon = function(){
        console.log(this.status);
        switch(this.status){
            case 'ECONNREFUSED':
                return 'icon-exclamation-sign'
                break;
            case 530:
                return 'icon-exclamation-sign'
                break;
            case 'PASS':
                return 'icon-ok-sign'
                break;
            default:
                return 'icon-question-sign'
                break;
        }
    }
    Template.sites.events({
        'click .addsite':function(){
            var newsite = ftpmirrors.insert({fields:[
                {description:'Site Name',name:'Name',value:''},
                {decription:'IP / Hostname',name:'Hostname',value:''},
                {decription:'Username',name:'Username',value:''},
                {decription:'Password',name:'Password',value:''},
                {decription:'Upload Directory',name:'Upload Directory',value:''},
                {decription:'Web Root',name:'Web Root',value:''}
            ]});

            setTimeout(function(){
                $("#sites .accordion-body.in").collapse('hide');
                setTimeout(function(){
                    $("#col-"+newsite).collapse('show');
                }, 200)
            }, 200)

        },
        'click .remove':function(){
            ftpmirrors.remove(this._id);
            if($("#sites .accordion-body.in").length == 1){
                $("#sites .accordion-body.in").zoomTo({targetsize:1, duration:600});
            }else{
                $("body").zoomTo({targetsize:1, duration:600});
            }
        },
        'click .test':function(){
            console.log(this._id)
            Session.set("lastUpdatedSite", this._id);
            Meteor.call('testFtpConnection',this,function(err, data){
                //console.log(data);
                //console.log(err);
            });
        }
    });
    Template.sites.rendered = function(){
        $("#sites .accordion-heading").click(function () {
            $("#sites .accordion-body.in").collapse('hide');
        });
        $("#sites .accordion-body").on('shown', function () {
            var thisdom = this;
            setTimeout(function(){
                $(thisdom).zoomTo({targetsize:0.75, duration:600});
                $('.help').popover('hide');
            }, 300);
        });
        $("#sites .accordion-body").on('hidden', function () {
            setTimeout(function(){
                $("body").zoomTo({targetsize:1, duration:600});
            }, 200);
        })
    }
    Template.sites.namefield = function(){
        var fields = this.fields;
        for(i=0;i<fields.length;i++){
            if(fields[i].name == "Name"){
                return fields[i].value;
            }
        }
    }
    Template.field.rendered=function(){
        var fielddata=this.data;
        var fielddom=this.firstNode;
        $(fielddom).find('.editable').editable({
            type:'text',
            mode:'inline',
            success:function(response,newValue){
                var ftpmirrorid=$(fielddom).parents('.site').attr('id');
                var fields=ftpmirrors.findOne({_id:ftpmirrorid}).fields;
                for(i=0;i<fields.length;i++){
                    var thisfield=fields[i];
                    if(thisfield.name == fielddata.name){
                        thisfield.value = newValue
                    };
                }
                ftpmirrors.update({_id:ftpmirrorid},{$set:{fields:fields}});
                Session.set("lastUpdatedSite", ftpmirrorid);
            }
        });
    }
    Template.sites.wasrendered = function(){
        if(this._id == Session.get("lastUpdatedSite")){
            return "in";
        }
    }
}

if (Meteor.isServer) {

}