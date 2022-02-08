const Users = require("../models/user");
const Roles = require("../models/roles");
const Driver = require("../models/driver");
const DriverState = require("../models/driverState");
const Car = require("../models/car");
const Country = require("../models/country");
const City = require("../models/city");
const Route = require("../models/route");
const Service = require("../models/service");
const ServiceDetails = require("../models/serviceDetails");
const Ticket = require("../models/ticket");
const Passenger = require("../models/passenger");
const Cargo = require("../models/cargo");
const Partner = require("../models/partner");
const PartnerBranch = require("../models/partnerBranch");
const DeliveryService = require("../models/deliveryService");
const PayDetails = require("../models/payDetails");
const PartnerDriver = require("../models/partnerDriver");
const PartnerBranchDriver = require("../models/partnerBranchDriver");
const DeliveryTransport = require("../models/deliveryTransport");
const Device = require("../models/device");
const Clients = require("../models/clients");
const Shop = require("../models/shop");

async function main() {
	const models = [
		Roles,
		Users,
		Country,
		City,
		Route,
		Service,
		ServiceDetails,
		Driver,
		DriverState,
		Car,
		Ticket,
		Passenger,
		Cargo,
		PartnerDriver,
		PartnerBranchDriver,
		Partner,
		PartnerBranch,
		DeliveryService,
		DeliveryTransport,
		Clients,
		Shop,
		PayDetails,
		Device,
	]

	for ( const i in models ){
		if (models.hasOwnProperty(i)){
			console.log('--->', i)
			await models[i].sync({alter: true});
		}
	}
	process.exit();
}

main().then(r => console.log(r-- > 'Done')).catch(e => console.log(e));
