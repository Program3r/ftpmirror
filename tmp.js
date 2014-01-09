ftpmirrors = new Meteor.Collection('ftpmirrors')

if (Meteor.isClient) {
    Template.sites.site=function(){
        return ftpmirrors.find();
    };
    Template.sites.events({
        'click .addsite':function(){
            ftpmirrors.insert({fields:[{description:'Your Name',name:'Name',value:''},{decription:'IP / HOSTNAME',name:'Hostname',value:''}]});
        }
    });
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
                ftpmirrors.update({_id:ftpmirrorid},{$set:{fields:fields}})
            }
        })
    }
}

if (Meteor.isServer) {

}