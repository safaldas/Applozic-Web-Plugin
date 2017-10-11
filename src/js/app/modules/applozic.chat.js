(function(window){
    //I recommend this
    'use strict';
    function define_Applozic(){
        var Applozic = {};
        var name = "Timmy";
        Applozic.greet = function(){
            alert("Hello from the " + name + " library.");
        }
        return Applozic;
    }
    //define globally if it doesn't already exist
    if(typeof(Applozic) === 'undefined'){
        window.Applozic = define_Applozic();
    }
    else{
        console.log("Applozic already defined.");
    }
})(window);
