export class AppLifeCycleEvent{
    //This method is triggered when the user loads the screen of an application for the first time
    public onAppStart(){
        clientGlobalObj.registerIconPool("o2c_v2","6-0-209","o2c_icons");
    }
}