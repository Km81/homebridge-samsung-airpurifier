var Service, Characteristic, Accessory;
var exec2 = require("child_process").exec;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Accessory = homebridge.hap.Accessory;
    //UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory('homebridge-samsung-airpurifier', 'SamsungAirpurifier', SamsungAirpuri);
}

function SamsungAirpuri(log, config) {
    this.log = log;
    this.name = config["name"];
    this.ip = config["ip"];
    this.token = config["token"];
    this.patchCert = config["patchCert"];
}

SamsungAirpuri.prototype = {

    execRequest: function(str, body, callback) {
        exec2(str, function(error, stdout, stderr) {
            callback(error, stdout, stderr)
        })
        //return stdout;
    },
    identify: function(callback) {
        this.log("장치 확인됨");
        callback(); // success
    },

    getServices: function() {

        //var uuid;
        //uuid = UUIDGen.generate(this.accessoryName);
        this.airpuriSamsung = new Service.AirPurifier(this.name);

        //전원 설정
        this.airpuriSamsung.getCharacteristic(Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        //현재 모드 설정
        this.airpuriSamsung.getCharacteristic(Characteristic.TargetAirPurifierState)
            .on('get', this.getTargetAirPurifierState.bind(this))       
            .on('set', this.setTargetAirPurifierState.bind(this));
   
        //현재 모드 확인
        this.airpuriSamsung.getCharacteristic(Characteristic.CurrentAirPurifierState)
            .on('get', this.getCurrentAirPurifierState.bind(this));
	   	    
        var informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung')
            .setCharacteristic(Characteristic.Model, 'Air purifier')
            .setCharacteristic(Characteristic.SerialNumber, 'AX40M6581WMD');
            
            
        return [informationService, this.airpuriSamsung];
    },

    //services

    getActive: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Operation.power\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
              if (body == "Off") {
                callback(null, Characteristic.Active.INACTIVE);
                //this.log("비활성화 확인");
              } else if (body == "On") {
                callback(null, Characteristic.Active.ACTIVE);
                //this.log("활성화 확인");                
              } else
		  this.log("활성화 확인 오류");
            }
        }.bind(this));
    },

    setActive: function(state, callback) {

        switch (state) {

            case Characteristic.Active.ACTIVE:
                var str;
                var body;
                //this.log("켜기 설정");
                str = 'curl -X PUT -d \'{"Operation": {"power" : "On"}}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0';
                this.airpuriSamsung.getCharacteristic(Characteristic.CurrentAirPurifierState).updateValue(2);
                
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                }.bind(this));
                break;

            case Characteristic.Active.INACTIVE:
                var str;
                var body;
                //this.log("끄기 설정");
                str = 'curl -X PUT -d \'{"Operation": {"power" : "Off"}}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0';
                this.airpuriSamsung.getCharacteristic(Characteristic.CurrentAirPurifierState).updateValue(0);
                
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                }.bind(this));
                break;
         }
    },

    
    getCurrentAirPurifierState: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Operation.power\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
            if (body == "Off") {
                callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
                //this.log("비활성화 모드 확인");
            } else if (body == "On") {
                callback(null, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
		//this.log("공기청정 모드 확인");
            } else
		this.log("현재 모드 확인 오류");
            }
        }.bind(this));
    },
	
	
    getTargetAirPurifierState: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[0].Wind.speedLevel\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = parseInt(stdout);
            if (body == 1 || body == 2 || body == 3 || body == 4) {
                callback(null, Characteristic.TargetAirPurifierState.MANUAL);
                //this.log("수동 모드 확인");
            } else if (body == 0) {
                callback(null, Characteristic.TargetAirPurifierState.AUTO);
                //this.log("자동 모드 확인");                
            } else
                this.log("목표 모드 확인 오류");    
            }
        }.bind(this));

    },

    setTargetAirPurifierState: function(state, callback) {

        switch (state) {

            case Characteristic.TargetAirPurifierState.MANUAL:
                var str;
                var body;
                //this.log("취침모드로 설정");
                str = 'curl -X PUT -d \'{"speedLevel": 1}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
                
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                }.bind(this));
                break;

            case Characteristic.TargetAirPurifierState.AUTO:
                var str;
                var body;
                //this.log("자동모드로 설정");
                str = 'curl -X PUT -d \'{"speedLevel": 0}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
                
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                }.bind(this));
                break;
         }
    }
}
