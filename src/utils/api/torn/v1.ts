interface BaseSelection {
	response: any;
	params: string | never;
	requiredID: boolean;
}
interface BaseSchema {
	selections: Record<string, BaseSelection>;
	defaultSelection: keyof BaseSchema["selections"];
}
export interface User extends BaseSchema {
	selections: {
		ammo: {
			response: {
				ammo: {
					ammoID: number;
					typeID: number;
					size:
						| "12 Gauge Cartridge"
						| "9mm Parabellum Round"
						| ".45 ACP Round"
						| "7.62 mm Rifle Round"
						| "5.56mm Rifle Round"
						| "5.7mm High Vel. Round"
						| "5.45mm Rifle Round"
						| ".25 ACP Round"
						| ".44 Special Round"
						| ".380 ACP Round"
						| "Warhead"
						| "Snow Ball"
						| "Flare"
						| "Stone"
						| "Bolt"
						| "Dart"
						| "Liter of Fuel"
						| "RPG"
						| "40mm Grenade";
					type:
						| "Standard"
						| "Incendiary"
						| "Tracer"
						| "Piercing"
						| "Hollow Point";
					quantity: number;
					equipped: 0 | 1;
				};
			};
			params: never;
			requiredID: false;
		};
		attacks: {
			response: {
				attacks: {
					[attack_id: string]: {
						code: string;
						timestamp_started: number;
						timestamp_ended: number;
						attacker_id: number | "";
						attacker_faction: number | "";
						defender_id: number;
						defender_faction: number;
						result:
							| "Attacked"
							| "Mugged"
							| "Hospitalized"
							| "Arrested"
							| "Escape"
							| "Lost"
							| "Assist"
							| "Stalemate"
							| "Timeout"
							| "Interrupted"
							| "Looted"
							| "Special";
						stealthed: 0 | 1;
						respect: number;
						attacker_name: string;
						attacker_factionname: string;
						defender_name: string;
						defender_factionname: string;
						chain: number;
						raid: 0 | 1;
						ranked_war: 0 | 1;
						respect_gain: number;
						respect_loss: number;
						modifiers: {
							fair_fight: number;
							war: 1 | 2;
							retaliation: 1 | 1.5;
							group_attack: number;
							overseas: 1 | 1.25;
							chain_bonus: number;
							warlord_bonus: string;
						};
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		attacksfull: {
			response: {
				attacks: {
					[attack_id: string]: {
						code: string;
						timestamp_started: number;
						timestamp_ended: number;
						attacker_id: number | "";
						attacker_faction: number | "";
						defender_id: number;
						defender_faction: number;
						result:
							| "Attacked"
							| "Mugged"
							| "Hospitalized"
							| "Arrested"
							| "Escape"
							| "Lost"
							| "Assist"
							| "Stalemate"
							| "Timeout"
							| "Interrupted"
							| "Looted"
							| "Special";
						stealthed: 0 | 1;
						respect: number;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		bars: {
			response: {
				server_time: number;
				happy: {
					current: number;
					maximum: number;
					increment: number;
					interval: number;
					ticktime: number;
					fulltime: number;
				};
				life: {
					current: number;
					maximum: number;
					increment: number;
					interval: number;
					ticktime: number;
					fulltime: number;
				};
				energy: {
					current: number;
					maximum: number;
					increment: number;
					interval: number;
					ticktime: number;
					fulltime: number;
				};
				nerve: {
					current: number;
					maximum: number;
					increment: number;
					interval: number;
					ticktime: number;
					fulltime: number;
				};
				chain: {
					current: number;
					maximum: number;
					timeout: number;
					modifier: number;
					cooldown: number;
				};
			};
			params: never;
			requiredID: false;
		};
		basic: {
			response: {
				level: number;
				gender: "Male" | "Female" | "Enby";
				player_id: number;
				name: string;
				status: {
					description: string;
					details: string;
					state:
						| "Okay"
						| "Traveling"
						| "Abroad"
						| "Hospital"
						| "Jail"
						| "Fallen"
						| "Federal";
					color: "green" | "blue" | "red";
					until: number;
				};
			};
			params: never;
			requiredID: true;
		};
		battlestats: {
			response: {
				strength: number;
				speed: number;
				dexterity: number;
				defense: number;
				total: number;
				strength_modifier: number;
				defense_modifier: number;
				speed_modifier: number;
				dexterity_modifier: number;
				strength_info: string[];
				defense_info: string[];
				speed_info: string[];
				dexterity_info: string[];
			};
			params: never;
			requiredID: false;
		};
		bazaar: {
			response: {
				bazaar: {
					ID: number;
					UID: number;
					name: string;
					type: string;
					quantity: number;
					price: number;
					market_price: number;
				};
			};
			params: never;
			requiredID: true;
		};
		cooldowns: {
			response: {
				cooldowns: { drug: number; medical: number; booster: number };
			};
			params: never;
			requiredID: false;
		};
		crimes: {
			response: {
				criminalrecord: {
					selling_illegal_products: number;
					theft: number;
					auto_theft: number;
					drug_deals: number;
					computer_crimes: number;
					murder: number;
					fraud_crimes: number;
					other: number;
					vandalism: number;
					counterfeiting: number;
					fraud: number;
					illicitservices: number;
					cybercrime: number;
					extortion: number;
					illegalproduction: number;
					total: number;
				};
			};
			params: never;
			requiredID: true;
		};
		criminalrecord: {
			response: {
				criminalrecord: {
					selling_illegal_products: number;
					theft: number;
					auto_theft: number;
					drug_deals: number;
					computer_crimes: number;
					murder: number;
					fraud_crimes: number;
					other: number;
					vandalism: number;
					counterfeiting: number;
					fraud: number;
					illicitservices: number;
					cybercrime: number;
					extortion: number;
					illegalproduction: number;
					total: number;
				};
			};
			params: never;
			requiredID: true;
		};
		discord: {
			response: { discord: { userID: number; discordID: string } };
			params: never;
			requiredID: true;
		};
		display: {
			response: {
				display: {
					ID: number;
					UID: number;
					name: string;
					type: string;
					quantity: number;
					circulation: number;
					market_price: number;
				};
			};
			params: never;
			requiredID: true;
		};
		education: {
			response: {
				education_current: number;
				education_timeleft: number;
				education_completed: number[];
			};
			params: never;
			requiredID: false;
		};
		equipment: {
			response: {
				equipment: {
					ID: number;
					UID: number;
					name: string;
					type: string;
					equipped: number;
					market_price: number;
					quantity: number;
				};
			};
			params: never;
			requiredID: false;
		};
		events: {
			response: {
				events: { [event_uuid: string]: { timestamp: number; event: string } };
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		gym: {
			response: { active_gym: number };
			params: never;
			requiredID: false;
		};
		hof: {
			response: {
				halloffame: {
					attacks: { value: number; rank: number };
					battlestats: { value: number; rank: number };
					busts: { value: number; rank: number };
					defends: { value: number; rank: number };
					networth: { value: number; rank: number };
					offences: { value: number; rank: number };
					revives: { value: number; rank: number };
					traveltime: { value: number; rank: number };
					workstats: { value: number; rank: number };
					level: { value: number; rank: number };
					rank: { value: number; rank: number };
					awards: { value: number; rank: number };
					racingwins: { value: number; rank: number };
					racingpoints: { value: number; rank: number };
					racingskill: { value: number; rank: number };
				};
			};
			params: never;
			requiredID: false;
		};
		honors: {
			response: { honors_awarded: number[]; honors_time: number[] };
			params: never;
			requiredID: false;
		};
		icons: {
			response: { icons: { [icon_id: string]: string } };
			params: never;
			requiredID: false;
		};
		inventory: {
			response: { inventory: string };
			params: never;
			requiredID: false;
		};
		jobpoints: {
			response: {
				jobpoints: {
					jobs: {
						army: number;
						casino: number;
						education: number;
						grocer: number;
						law: number;
						medical: number;
					};
					companies: {
						[company_type_id: string]: { name: string; jobpoints: number };
					};
				};
			};
			params: never;
			requiredID: false;
		};
		log: {
			response: {
				log: {
					[log_id: string]: {
						category: string;
						data: Record<string, any>;
						log: number;
						params: Record<string, any>;
						timestamp: number;
						title: string;
					};
				};
			};
			params: "from" | "to" | "log" | "cat";
			requiredID: false;
		};
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		medals: {
			response: { medals_awarded: number[]; medals_time: number[] };
			params: never;
			requiredID: true;
		};
		merits: {
			response: {
				merits: {
					"Nerve Bar": number;
					"Critical Hit Rate": number;
					"Life Points": number;
					"Crime XP": number;
					"Education Length": number;
					Awareness: number;
					"Bank Interest": number;
					"Masterful Looting": number;
					Stealth: number;
					Hospitalizing: number;
					"Addiction Mitigation": number;
					"Employee Effectiveness": number;
					Brawn: number;
					Protection: number;
					Sharpness: number;
					Evasion: number;
					"Heavy Artillery Mastery": number;
					"Machine Gun Mastery": number;
					"Rifle Mastery": number;
					"SMG Mastery": number;
					"Shotgun Mastery": number;
					"Pistol Mastery": number;
					"Club Mastery": number;
					"Piercing Mastery": number;
					"Slashing Mastery": number;
					"Mechanical Mastery": number;
					"Temporary Mastery": number;
				};
			};
			params: never;
			requiredID: false;
		};
		messages: {
			response: {
				messages: {
					[id: string]: {
						timestamp: number;
						ID: number;
						name: string;
						type: "User message" | "Faction newsletter" | "Company newsletter";
						title: string;
						seen: 0 | 1;
						read: 0 | 1;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		missions: {
			response: {
				missions: {
					Duke: {
						title: string;
						status: "notAccepted" | "accepted" | "failed" | "completed";
					};
				};
			};
			params: never;
			requiredID: false;
		};
		money: {
			response: {
				points: number;
				cayman_bank: number;
				vault_amount: number;
				company_funds: number;
				daily_networth: number;
				money_onhand: number;
				city_bank: { amount: number; time_left: number };
			};
			params: never;
			requiredID: false;
		};
		networth: {
			response: {
				networth: {
					pending: number;
					wallet: number;
					bank: number;
					points: number;
					cayman: number;
					vault: number;
					piggybank: number;
					items: number;
					displaycase: number;
					bazaar: number;
					trade: number;
					itemmarket: number;
					properties: number;
					stockmarket: number;
					auctionhouse: number;
					company: number;
					bookie: number;
					enlistedcars: number;
					loan: number;
					unpaidfees: number;
					total: number;
					parsetime: number;
					timestamp: number;
				};
			};
			params: never;
			requiredID: false;
		};
		newevents: {
			response: {
				player_id: number;
				events: {
					[event_uuid: string]: {
						timestamp: number;
						event: string;
						seen: 0 | 1;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		newmessages: {
			response: {
				messages: {
					[message_id: string]: {
						timestamp: number;
						ID: number;
						name: string;
						type: "User message" | "Faction newsletter" | "Company newsletter";
						title: string;
						seen: 0 | 1;
						read: 0 | 1;
					};
				};
				player_id: number;
			};
			params: never;
			requiredID: false;
		};
		notifications: {
			response: {
				notifications: {
					messages: number;
					events: number;
					awards: number;
					competition: number;
				};
			};
			params: never;
			requiredID: false;
		};
		perks: {
			response: {
				faction_perks: string[];
				job_perks: string[];
				property_perks: string[];
				education_perks: string[];
				enhancer_perks: string[];
				book_perks: string[];
				stock_perks: string[];
				merit_perks: string[];
			};
			params: never;
			requiredID: false;
		};
		personalstats: {
			response: {
				personalstats: {
					activestreak: number;
					alcoholused: number;
					argtravel: number;
					arrestsmade: number;
					attackcriticalhits: number;
					attackdamage: number;
					attackhits: number;
					attackmisses: number;
					attacksassisted: number;
					attacksdraw: number;
					attackslost: number;
					attacksstealthed: number;
					attackswon: number;
					attackswonabroad: number;
					auctionsells: number;
					auctionswon: number;
					awards: number;
					axehits: number;
					bazaarcustomers: number;
					bazaarprofit: number;
					bazaarsales: number;
					bestactivestreak: number;
					bestdamage: number;
					bestkillstreak: number;
					bloodwithdrawn: number;
					booksread: number;
					boostersused: number;
					bountiescollected: number;
					bountiesplaced: number;
					bountiesreceived: number;
					candyused: number;
					cantaken: number;
					cantravel: number;
					caytravel: number;
					chahits: number;
					chitravel: number;
					cityfinds: number;
					cityitemsbought: number;
					classifiedadsplaced: number;
					companymailssent: number;
					consumablesused: number;
					contractscompleted: number;
					counterfeiting: number;
					criminaloffenses: number;
					cybercrime: number;
					daysbeendonator: number;
					defendslost: number;
					defendslostabroad: number;
					defendsstalemated: number;
					defendswon: number;
					defense: number;
					dexterity: number;
					drugsused: number;
					dubtravel: number;
					dukecontractscompleted: number;
					dumpfinds: number;
					dumpsearches: number;
					eastereggs: number;
					eastereggsused: number;
					elo: number;
					endurance: number;
					energydrinkused: number;
					extortion: number;
					exttaken: number;
					factionmailssent: number;
					failedbusts: number;
					fraud: number;
					friendmailssent: number;
					grehits: number;
					h2hhits: number;
					hawtravel: number;
					heahits: number;
					highestbeaten: number;
					hollowammoused: number;
					hospital: number;
					illegalproduction: number;
					illicitservices: number;
					incendiaryammoused: number;
					intelligence: number;
					investedprofit: number;
					itemsbought: number;
					itemsboughtabroad: number;
					itemsdumped: number;
					itemslooted: number;
					itemssent: number;
					jailed: number;
					japtravel: number;
					jobpointsused: number;
					kettaken: number;
					killstreak: number;
					largestmug: number;
					lontravel: number;
					lsdtaken: number;
					machits: number;
					mailssent: number;
					manuallabor: number;
					medicalitemsused: number;
					meritsbought: number;
					mextravel: number;
					missioncreditsearned: number;
					missionscompleted: number;
					moneyinvested: number;
					moneymugged: number;
					nerverefills: number;
					networth: number;
					networthauctionhouse: number;
					networthbank: number;
					networthbazaar: number;
					networthbookie: number;
					networthcayman: number;
					networthcompany: number;
					networthdisplaycase: number;
					networthenlistedcars: number;
					networthitemmarket: number;
					networthitems: number;
					networthloan: number;
					networthpending: number;
					networthpiggybank: number;
					networthpoints: number;
					networthproperties: number;
					networthstockmarket: number;
					networthunpaidfees: number;
					networthvault: number;
					networthwallet: number;
					onehitkills: number;
					opitaken: number;
					organisedcrimes: number;
					overdosed: number;
					pcptaken: number;
					peoplebought: number;
					peopleboughtspent: number;
					peoplebusted: number;
					personalsplaced: number;
					piehits: number;
					piercingammoused: number;
					pishits: number;
					pointsbought: number;
					pointssold: number;
					racesentered: number;
					raceswon: number;
					racingpointsearned: number;
					racingskill: number;
					raidhits: number;
					rankedwarhits: number;
					rankedwarringwins: number;
					receivedbountyvalue: number;
					refills: number;
					rehabcost: number;
					rehabs: number;
					respectforfaction: number;
					retals: number;
					revives: number;
					reviveskill: number;
					revivesreceived: number;
					rifhits: number;
					roundsfired: number;
					shohits: number;
					shrtaken: number;
					slahits: number;
					smghits: number;
					soutravel: number;
					specialammoused: number;
					speed: number;
					spetaken: number;
					spousemailssent: number;
					statenhancersused: number;
					stockfees: number;
					stocklosses: number;
					stocknetprofits: number;
					stockpayouts: number;
					stockprofits: number;
					strength: number;
					switravel: number;
					territoryclears: number;
					territoryjoins: number;
					territorytime: number;
					theft: number;
					theyrunaway: number;
					tokenrefills: number;
					totalbountyreward: number;
					totalbountyspent: number;
					totalstats: number;
					totalworkingstats: number;
					tracerammoused: number;
					trades: number;
					trainsreceived: number;
					traveltime: number;
					traveltimes: number;
					unarmoredwon: number;
					useractivity: number;
					vandalism: number;
					victaken: number;
					virusescoded: number;
					weaponsbought: number;
					xantaken: number;
					yourunaway: number;
				};
			};
			params: "timestamp" | "stat" | "cat";
			requiredID: true;
		};
		publicstatus: {
			response: {
				status:
					| "Civilian"
					| "Reporter"
					| "Wiki Contributor"
					| "Wiki Editor"
					| "Committee"
					| "Helper"
					| "Moderator"
					| "Officer"
					| "Admin"
					| "NPC";
				userID: number;
				playername: string;
				baned: boolean;
			};
			params: never;
			requiredID: true;
		};
		profile: {
			response: {
				rank: string;
				level: number;
				honor: number;
				gender: "Male" | "Female" | "Enby";
				property: string;
				signup: string;
				awards: number;
				friends: number;
				enemies: number;
				forum_posts: number;
				karma: number;
				age: number;
				role:
					| "Civilian"
					| "Reporter"
					| "Wiki Contributor"
					| "Wiki Editor"
					| "Committee"
					| "Helper"
					| "Moderator"
					| "Officer"
					| "Admin"
					| "NPC";
				donator: 0 | 1;
				player_id: number;
				name: string;
				profile_image: string;
				property_id: number;
				competition: {
					name:
						| "Halloween"
						| "Elimination"
						| "Easter Egg Hunt"
						| "Dog Tags"
						| "Mr & Ms Torn"
						| "Rock, Paper, Scissors";
					treats_collected_total: number;
					team: string;
					attacks: number;
					score: number;
					text: string;
					total: number;
					votes: number;
					image: string;
					position: unknown;
					status: "rock" | "paper" | "scissors";
				};
				revivable: 0 | 1;
				life: {
					current: number;
					maximum: number;
					increment: number;
					interval: number;
					ticktime: number;
					fulltime: number;
				};
				status: {
					description: string;
					details: string;
					state:
						| "Okay"
						| "Traveling"
						| "Abroad"
						| "Hospital"
						| "Jail"
						| "Fallen"
						| "Federal";
					color: "green" | "blue" | "red";
					until: number;
				};
				job: {
					job: string;
					position: string;
					company_id: number;
					company_name: string;
					company_type: number;
				};
				faction: {
					position: string;
					faction_id: number;
					days_in_faction: number;
					faction_name: string;
					faction_tag: string;
				};
				married: { spouse_id: number; spouse_name: string; duration: number };
				basicicons: { [icon_id: string]: string };
				states: { hospital_timestamp: number; jail_timestamp: number };
				last_action: {
					status: "Online" | "Idle" | "Offline";
					timestamp: number;
					relative: string;
				};
			};
			params: never;
			requiredID: true;
		};
		properties: {
			response: {
				properties: {
					[property_id: string]: {
						owner_id: number;
						property_type: number;
						property: string;
						status: string;
						happy: number;
						upkeep: number;
						staff_cost: number;
						cost: number;
						marketprice: number;
						modifications: {
							interior: number;
							hot_tub: number;
							sauna: number;
							pool: number;
							open_bar: number;
							shooting_range: number;
							vault: number;
							medical_facility: number;
							airstrip: number;
							yacht: number;
						};
						staff: {
							maid: number;
							guard: number;
							pilot: number;
							butler: number;
							doctor: number;
						};
						rented: {
							user_id: number;
							days_left: number;
							total_cost: number;
							cost_per_day: number;
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		refills: {
			response: {
				refills: {
					energy_refill_used: boolean;
					nerve_refill_used: boolean;
					token_refill_used: boolean;
					special_refills_available: number;
				};
			};
			params: never;
			requiredID: false;
		};
		reports: {
			response: {
				reports: {
					id: string;
					user_id: number;
					target: number;
					type:
						| "anonymousbounties"
						| "stats"
						| "money"
						| "friendorfoe"
						| "mostwanted"
						| "references"
						| "truelevel"
						| "investment";
					report: {
						strength: number;
						speed: number;
						dexterity: number;
						defense: number;
						total_battlestats: number;
						money: number;
						friendlist: { user_id: number; name: string };
						enemylist: { user_id: number; name: string };
						toplist: { user_id: number; name: string; warrant: number };
						otherlist: { user_id: number; name: string; warrant: number };
						faction_history: {
							ID: number;
							name: string;
							joined: string;
							left: string;
						};
						company_history: {
							ID: number;
							name: string;
							joined: string;
							left: string;
						};
						truelevel: number;
						invested_amount: number;
						invested_completion: string;
						bounties: string[];
					};
					timestamp: number;
				};
			};
			params: never;
			requiredID: false;
		};
		revives: {
			response: {
				revives: {
					[user_id: string]: {
						timestamp: number;
						result: "success" | "failure";
						chance: number;
						reviver_id: number;
						reviver_faction: number;
						target_id: number;
						target_faction: number;
						target_hospital_reason: string;
						target_early_discharge: 0 | 1;
						target_last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
						};
						reviver_name: string;
						reviver_factionname: string;
						target_name: string;
						target_factionname: string;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		revivesfull: {
			response: {
				revives: {
					[user_id: string]: {
						timestamp: number;
						result: "success" | "failure";
						chance: number;
						reviver_id: number;
						reviver_faction: number;
						target_id: number;
						target_faction: number;
						target_hospital_reason: string;
						target_early_discharge: 0 | 1;
						target_last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
						};
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		skills: {
			response: {
				bootlegging: string;
				burglary: string;
				card_skimming: string;
				cracking: string;
				disposal: string;
				forgery: string;
				graffiti: string;
				hustling: string;
				pickpocketing: string;
				reviving: string;
				search_for_cash: string;
				shoplifting: string;
				hunting: string;
				racing: string;
				player_id: number;
			};
			params: never;
			requiredID: false;
		};
		stocks: {
			response: {
				stocks: {
					[stock_id: string]: {
						stock_id: number;
						total_shares: number;
						dividend: {
							ready: 0 | 1;
							increment: number;
							progress: number;
							frequency: number;
						};
						benefit: {
							ready: 0 | 1;
							increment: number;
							progress: number;
							frequency: number;
						};
						transactions: {
							[some_id: string]: {
								shares: number;
								bought_price: number;
								time_bought: number;
							};
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
		travel: {
			response: {
				travel: {
					destination: string;
					method: "Standard" | "Airstrip" | "Private" | "Business";
					timestamp: number;
					departed: number;
					time_left: number;
				};
			};
			params: never;
			requiredID: false;
		};
		weaponexp: {
			response: { weaponexp: { itemID: number; name: string; exp: number } };
			params: never;
			requiredID: false;
		};
		workstats: {
			response: {
				manual_labor: number;
				intelligence: number;
				endurance: number;
			};
			params: never;
			requiredID: false;
		};
	};
}
export interface Property extends BaseSchema {
	selections: {
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
		property: {
			response: {
				property: {
					owner_id: number;
					property_type: number;
					happy: number;
					upkeep: number;
					upgrades: string[];
					staff: string[];
					rented: {
						user_id: number;
						days_left: number;
						total_cost: number;
						cost_per_day: number;
					};
					users_living: number | string;
				};
			};
			params: never;
			requiredID: true;
		};
	};
}
export interface Faction extends BaseSchema {
	selections: {
		applications: {
			response: {
				applications: {
					[user_id: string]: {
						userID: number;
						name: string;
						level: number;
						stats: {
							strength: number;
							speed: number;
							dexterity: number;
							defense: number;
						};
						message: string;
						expires: number;
						status: "active" | "declined" | "withdrawn" | "accepted";
					};
				};
			};
			params: never;
			requiredID: false;
		};
		armor: {
			response: {
				armor: {
					ID: number;
					name: string;
					type: string;
					quantity: number;
					available: number;
					loaned: number;
					loaned_to: number | string;
				};
			};
			params: never;
			requiredID: false;
		};
		armorynews: {
			response: {
				armorynews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		attacknews: {
			response: {
				attacknews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		attacks: {
			response: {
				attacks: {
					[attack_id: string]: {
						code: string;
						timestamp_started: number;
						timestamp_ended: number;
						attacker_id: number | "";
						attacker_faction: number | "";
						defender_id: number;
						defender_faction: number;
						result:
							| "Attacked"
							| "Mugged"
							| "Hospitalized"
							| "Arrested"
							| "Escape"
							| "Lost"
							| "Assist"
							| "Stalemate"
							| "Timeout"
							| "Interrupted"
							| "Looted"
							| "Special";
						stealthed: 0 | 1;
						respect: number;
						attacker_name: string;
						attacker_factionname: string;
						defender_name: string;
						defender_factionname: string;
						chain: number;
						raid: 0 | 1;
						ranked_war: 0 | 1;
						respect_gain: number;
						respect_loss: number;
						modifiers: {
							fair_fight: number;
							war: 1 | 2;
							retaliation: 1 | 1.5;
							group_attack: number;
							overseas: 1 | 1.25;
							chain_bonus: number;
							warlord_bonus: string;
						};
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		attacksfull: {
			response: {
				attacks: {
					[attack_id: string]: {
						code: string;
						timestamp_started: number;
						timestamp_ended: number;
						attacker_id: number | "";
						attacker_faction: number | "";
						defender_id: number;
						defender_faction: number;
						result:
							| "Attacked"
							| "Mugged"
							| "Hospitalized"
							| "Arrested"
							| "Escape"
							| "Lost"
							| "Assist"
							| "Stalemate"
							| "Timeout"
							| "Interrupted"
							| "Looted"
							| "Special";
						stealthed: 0 | 1;
						respect: number;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		basic: {
			response: {
				ID: number;
				name: string;
				tag: number | string;
				tag_image: string;
				leader: number;
				"co-leader": number;
				respect: number;
				age: number;
				capacity: number;
				best_chain: number;
				ranked_wars: {
					[war_id: string]: {
						factions: {
							[faction_id: string]: {
								name: string;
								score: number;
								chain: number;
							};
						};
						war: { start: number; end: number; target: number; winner: number };
					};
				};
				territory_wars: {
					territory_war_id: number;
					territory: string;
					assaulting_faction: number;
					defending_faction: number;
					score: number;
					required_score: number;
					start_time: number;
					end_time: number;
				};
				raid_wars: {
					raiding_faction: number;
					defending_faction: number;
					raider_score: string;
					defender_score: number;
					start_time: number;
				};
				peace: { [faction_id: string]: number };
				rank: {
					level: number;
					name:
						| "Unranked"
						| "Bronze"
						| "Silver"
						| "Gold"
						| "Platinum"
						| "Diamond";
					division: number;
					position: number;
					wins: number;
				};
				members: {
					[user_id: string]: {
						name: string;
						level: number;
						days_in_faction: number;
						last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
							relative: string;
						};
						status: {
							description: string;
							details: string;
							state:
								| "Okay"
								| "Traveling"
								| "Abroad"
								| "Hospital"
								| "Jail"
								| "Fallen"
								| "Federal";
							color: "green" | "blue" | "red";
							until: number;
						};
						position: string;
					};
				};
			};
			params: never;
			requiredID: true;
		};
		boosters: {
			response: {
				boosters: { ID: number; name: string; type: string; quantity: number };
			};
			params: never;
			requiredID: false;
		};
		caches: {
			response: {
				caches: { ID: number; name: string; type: string; quantity: number };
			};
			params: never;
			requiredID: false;
		};
		cesium: {
			response: { cesium: unknown };
			params: never;
			requiredID: false;
		};
		chain: {
			response: {
				chain: {
					current: number;
					max: number;
					timeout: number;
					modifier: number;
					cooldown: number;
					start: number;
					end: number;
				};
			};
			params: never;
			requiredID: true;
		};
		chainreport: {
			response: {
				chainreport: {
					factionID: number;
					chain: number;
					start: number;
					end: number;
					leave: number;
					mug: number;
					hospitalize: number;
					assists: number;
					overseas: number;
					draws: number;
					escapes: number;
					losses: number;
					respect: number;
					targets: number;
					warhits: number;
					besthit: number;
					retaliations: number;
					members: {
						[user_id: string]: {
							userID: number;
							attacks: number;
							respect: number;
							avg: number;
							leave: number;
							mug: number;
							hosp: number;
							war: number;
							bonus: number;
							assist: number;
							retal: number;
							overseas: number;
							draw: number;
							escape: number;
							loss: number;
							best: number;
							level: number;
							factionID: number;
						};
					};
					bonuses: {
						chain: number;
						attacker: number;
						defender: number;
						respect: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		chains: {
			response: {
				chains: {
					[chain_id: string]: {
						chain: number;
						respect: string;
						start: number;
						end: number;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		contributors: {
			response: {
				contributors:
					| {
							[faction_stat: string]: {
								contributed: number;
								in_faction: 0 | 1;
							};
					  }
					| {
							[user_stat: string]: {
								[user_id: string]: { contributed: number; in_faction: 0 | 1 };
							};
					  };
			};
			params: "stat";
			requiredID: false;
		};
		crimeexp: {
			response: { crimeexp: number[] };
			params: never;
			requiredID: false;
		};
		crimenews: {
			response: {
				crimenews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		crimes: {
			response: {
				crimes: {
					[id: string]: {
						crime_id: number;
						crime_name: string;
						participants: {
							[user_id: string]: {
								description: string;
								details: string;
								state:
									| "Okay"
									| "Traveling"
									| "Abroad"
									| "Hospital"
									| "Jail"
									| "Fallen"
									| "Federal";
								color: "green" | "blue" | "red";
								until: number;
							};
						};
						time_started: number;
						time_ready: number;
						time_left: number;
						time_completed: number;
						initiated: 0 | 1;
						initiated_by: number;
						planned_by: number;
						success: 0 | 1;
						money_gain: number;
						respect_gain: number;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		currency: {
			response: { faction_id: number; points: number; money: number };
			params: never;
			requiredID: false;
		};
		donations: {
			response: {
				donations: {
					[user_id: string]: {
						name: string;
						money_balance: number;
						points_balance: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		drugs: {
			response: {
				drugs: { ID: number; name: string; type: string; quantity: number };
			};
			params: never;
			requiredID: false;
		};
		fundsnews: {
			response: {
				fundsnews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		mainnews: {
			response: {
				mainnews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		medical: {
			response: {
				medical: { ID: number; name: string; type: string; quantity: number };
			};
			params: never;
			requiredID: false;
		};
		membershipnews: {
			response: {
				membershipnews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		positions: {
			response: {
				positions: {
					[position: string]: {
						default: 0 | 1;
						canUseMedicalItem: 0 | 1;
						canUseBoosterItem: 0 | 1;
						canUseDrugItem: 0 | 1;
						canUseEnergyRefill: 0 | 1;
						canUseNerveRefill: 0 | 1;
						canLoanTemporaryItem: 0 | 1;
						canLoanWeaponAndArmory: 0 | 1;
						canRetrieveLoanedArmory: 0 | 1;
						canPlanAndInitiateOrganisedCrime: 0 | 1;
						canAccessFactionApi: 0 | 1;
						canGiveItem: 0 | 1;
						canGiveMoney: 0 | 1;
						canGivePoints: 0 | 1;
						canManageForum: 0 | 1;
						canManageApplications: 0 | 1;
						canKickMembers: 0 | 1;
						canAdjustMemberBalance: 0 | 1;
						canManageWars: 0 | 1;
						canManageUpgrades: 0 | 1;
						canSendNewsletter: 0 | 1;
						canChangeAnnouncement: 0 | 1;
						canChangeDescription: 0 | 1;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		rankedwars: {
			response: {
				rankedwars: {
					[war_id: string]: {
						factions: {
							[faction_id: string]: {
								name: string;
								score: number;
								chain: number;
							};
						};
						war: { start: number; end: number; target: number; winner: number };
					};
				};
			};
			params: "limit";
			requiredID: true;
		};
		reports: {
			response: {
				reports: {
					id: string;
					user_id: number;
					target: number;
					type:
						| "anonymousbounties"
						| "stats"
						| "money"
						| "friendorfoe"
						| "mostwanted"
						| "references"
						| "truelevel"
						| "investment";
					report: {
						strength: number;
						speed: number;
						dexterity: number;
						defense: number;
						total_battlestats: number;
						money: number;
						friendlist: { user_id: number; name: string };
						enemylist: { user_id: number; name: string };
						toplist: { user_id: number; name: string; warrant: number };
						otherlist: { user_id: number; name: string; warrant: number };
						faction_history: {
							ID: number;
							name: string;
							joined: string;
							left: string;
						};
						company_history: {
							ID: number;
							name: string;
							joined: string;
							left: string;
						};
						truelevel: number;
						invested_amount: number;
						invested_completion: string;
						bounties: string[];
					};
					timestamp: number;
				};
			};
			params: never;
			requiredID: false;
		};
		revives: {
			response: {
				revives: {
					[user_id: string]: {
						timestamp: number;
						result: "success" | "failure";
						chance: number;
						reviver_id: number;
						reviver_faction: number;
						target_id: number;
						target_faction: number;
						target_hospital_reason: string;
						target_early_discharge: 0 | 1;
						target_last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
						};
						reviver_name: string;
						reviver_factionname: string;
						target_name: string;
						target_factionname: string;
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		revivesfull: {
			response: {
				revives: {
					[user_id: string]: {
						timestamp: number;
						result: "success" | "failure";
						chance: number;
						reviver_id: number;
						reviver_faction: number;
						target_id: number;
						target_faction: number;
						target_hospital_reason: string;
						target_early_discharge: 0 | 1;
						target_last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
						};
					};
				};
			};
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		stats: {
			response: {
				stats: {
					organisedcrimerespect: number;
					organisedcrimemoney: number;
					organisedcrimesuccess: number;
					organisedcrimefail: number;
					territoryrespect: number;
					highestterritories: number;
					bestchain: number;
					attacksdamagehits: number;
					attacksdamage: number;
					hosptimegiven: number;
					attackshosp: number;
					attackswon: number;
					attacksdamaging: number;
					hosps: number;
					hosptimereceived: number;
					attackslost: number;
					medicalitemsused: number;
					medicalcooldownused: number;
					medicalitemrecovery: number;
					criminaloffences: number;
					busts: number;
					drugsused: number;
					revives: number;
					gymtrains: number;
					gymstrength: number;
					traveltimes: number;
					traveltime: number;
					rehabs: number;
					gymdefense: number;
					attacksmug: number;
					attacksleave: number;
					gymspeed: number;
					jails: number;
					caymaninterest: number;
					gymdexterity: number;
					hunting: number;
					drugoverdoses: number;
					candyused: number;
					alcoholused: number;
					energydrinkused: number;
					attacksrunaway: number;
				};
			};
			params: never;
			requiredID: false;
		};
		temporary: {
			response: {
				temporary: {
					ID: number;
					name: string;
					type: string;
					quantity: number;
					available: number;
					loaned: number;
					loaned_to: number | string;
				};
			};
			params: never;
			requiredID: false;
		};
		territory: {
			response: {
				territory: {
					[territory: string]: {
						sector: number;
						size: number;
						density: number;
						slots: number;
						daily_respect: number;
						faction: number;
						coordinate_x: string;
						coordinate_y: string;
						racket: {
							name: string;
							level: number;
							reward: string;
							created: number;
							changed: number;
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		territorynews: {
			response: {
				territorynews: { [id: string]: { news: string; timestamp: number } };
			};
			params: "from" | "to" | "sort" | "limit";
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
		upgrades: {
			response: {
				state: "peace" | "war";
				upgrades: {
					[id: string]: {
						branch:
							| "Core"
							| "Criminality"
							| "Fortitude"
							| "Voracity"
							| "Toleration"
							| "Excursion"
							| "Steadfast"
							| "Aggression"
							| "Suppression";
						branchorder: number;
						branchmultiplier: number;
						name: string;
						level: number;
						basecost: number;
						ability: string;
						unlocked: string;
						can_be_unset: number;
					};
				};
				war: {
					[id: string]: {
						branch:
							| "Core"
							| "Criminality"
							| "Fortitude"
							| "Voracity"
							| "Toleration"
							| "Excursion"
							| "Steadfast"
							| "Aggression"
							| "Suppression";
						branchorder: number;
						branchmultiplier: number;
						name: string;
						level: number;
						basecost: number;
						ability: string;
						unlocked: string;
						can_be_unset: number;
					};
				};
				peace: {
					[id: string]: {
						branch:
							| "Core"
							| "Criminality"
							| "Fortitude"
							| "Voracity"
							| "Toleration"
							| "Excursion"
							| "Steadfast"
							| "Aggression"
							| "Suppression";
						branchorder: number;
						branchmultiplier: number;
						name: string;
						level: number;
						basecost: number;
						ability: string;
						unlocked: string;
						can_be_unset: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		weapons: {
			response: {
				weapons: {
					ID: number;
					name: string;
					type: string;
					quantity: number;
					available: number;
					loaned: number;
					loaned_to: number | string;
				};
			};
			params: never;
			requiredID: false;
		};
	};
}
export interface Company extends BaseSchema {
	selections: {
		applications: {
			response: {
				applications: {
					[user_id: string]: {
						userID: number;
						name: string;
						level: number;
						stats: {
							intelligence: number;
							endurance: number;
							manual_labor: number;
						};
						message: string;
						expires: number;
						status: "active" | "declined" | "withdrawn" | "accepted";
					};
				};
			};
			params: never;
			requiredID: false;
		};
		companies: {
			response: {
				cards: {
					[company_id: string]: {
						ID: number;
						company_type: number;
						rating: number;
						name: string;
						director: number;
						employees_hired: number;
						employees_capacity: number;
						daily_income: number;
						daily_customers: number;
						weekly_income: number;
						weekly_customers: number;
						days_old: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		detailed: {
			response: {
				ID: number;
				company_funds: number;
				company_bank: number;
				popularity: number;
				efficiency: number;
				environment: number;
				trains_available: number;
				advertising_budget: number;
				upgrades: {
					company_size: number;
					staffroom_size: string;
					storage_size: string;
					storage_space: number;
				};
				value: number;
			};
			params: never;
			requiredID: false;
		};
		employees: {
			response: {
				company_employees: {
					[user_id: string]: {
						name: string;
						position: string;
						days_in_company: number;
						wage: number;
						manual_labor: number;
						intelligence: number;
						endurance: number;
						effectiveness: {
							working_stats: number;
							settled_in: number;
							merits: number;
							director_education: number;
							addiction: number;
							inactivity: number;
							total: number;
						};
						last_action: {
							status: "Online" | "Idle" | "Offline";
							timestamp: number;
							relative: string;
						};
						status: {
							description: string;
							details: string;
							state:
								| "Okay"
								| "Traveling"
								| "Abroad"
								| "Hospital"
								| "Jail"
								| "Fallen"
								| "Federal";
							color: "green" | "blue" | "red";
							until: number;
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		news: {
			response: { news: { [id: string]: { news: string; timestamp: number } } };
			params: "from" | "to" | "limit";
			requiredID: false;
		};
		profile: {
			response: {
				company: {
					ID: number;
					company_type: number;
					rating: number;
					name: string;
					director: number;
					employees_hired: number;
					employees_capacity: number;
					daily_income: number;
					daily_customers: number;
					weekly_income: number;
					weekly_customers: number;
					days_old: number;
					employees: {
						[user_id: string]: {
							name: string;
							position: string;
							days_in_company: number;
							last_action: {
								status: "Online" | "Idle" | "Offline";
								timestamp: number;
								relative: string;
							};
							status: {
								description: string;
								details: string;
								state:
									| "Okay"
									| "Traveling"
									| "Abroad"
									| "Hospital"
									| "Jail"
									| "Fallen"
									| "Federal";
								color: "green" | "blue" | "red";
								until: number;
							};
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		stock: {
			response: {
				company_stock: {
					[stock_item_name: string]: {
						cost: number;
						rrp: number;
						price: number;
						in_stock: number;
						on_order: number;
						sold_amount: number;
						sold_worth: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
	};
}
export interface Market extends BaseSchema {
	selections: {
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
		bazaar: {
			response: { bazaar: { cost: number; quantity: number } };
			params: never;
			requiredID: false;
		};
		itemmarket: {
			response: { itemmarket: { cost: number; quantity: number } };
			params: never;
			requiredID: false;
		};
		pointsmarket: {
			response: {
				pointsmarket: {
					[some_id: string]: {
						cost: number;
						quantity: number;
						total_cost: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
	};
}
export interface Torn extends BaseSchema {
	selections: {
		bank: {
			response: {
				bank: {
					"1w": number;
					"2w": number;
					"1m": number;
					"2m": number;
					"3m": number;
				};
			};
			params: never;
			requiredID: false;
		};
		cards: {
			response: {
				cards: {
					[card_id: string]: {
						name: string;
						short: number | string;
						rank: number | string;
						class: string;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		chainreport: {
			response: {
				chainreport: {
					code: number;
					error: string;
					factionID: number;
					chain: number;
					start: number;
					end: number;
					leave: number;
					mug: number;
					hospitalize: number;
					assists: number;
					overseas: number;
					draws: number;
					escapes: number;
					losses: number;
					respect: number;
					targets: number;
					warhits: number;
					besthit: number;
					retaliations: number;
					members: {
						[user_id: string]: {
							userID: number;
							attacks: number;
							respect: number;
							avg: number;
							leave: number;
							mug: number;
							hosp: number;
							war: number;
							bonus: number;
							assist: number;
							retal: number;
							overseas: number;
							draw: number;
							escape: number;
							loss: number;
							best: number;
							level: number;
							factionID: number;
						};
					};
					bonuses: {
						chain: number;
						attacker: number;
						defender: number;
						respect: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		cityshops: {
			response: {
				cityshops: {
					[shop_id: string]: {
						name: string;
						inventory: {
							[item_id: string]: {
								name: string;
								type: string;
								price: number;
								in_stock: number;
							};
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		companies: {
			response: {
				companies: {
					[company_id: string]: {
						name: string;
						cost: number;
						default_employees: number;
						positions: {
							[name: string]: {
								man_required: number;
								int_required: number;
								end_required: number;
								man_gain: number;
								int_gain: number;
								end_gain: number;
								special_ability:
									| "None"
									| "Cleaner"
									| "Manager"
									| "Secretary"
									| "Trainer"
									| "Marketer";
								description: string;
							};
						};
						stock: { [name: string]: { cost: number | ""; rrp: number } };
						specials: {
							[name: string]: {
								effect: string;
								cost: number;
								rating_required: number;
							};
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		competition: {
			response: {
				competition: {
					teams: {
						position: number;
						lives: number;
						losses: number;
						name: string;
						score: number;
						status: "eliminated" | "before-eliminated" | "<unknown>";
						team: string;
						participants: unknown;
						wins: number;
					};
					name:
						| "Halloween"
						| "Elimination"
						| "Easter Egg Hunt"
						| "Dog Tags"
						| "Mr & Ms Torn";
					leaderboardmrs: { user_id: number; score: number; position: number };
					leaderboardmr: { user_id: number; score: number; position: number };
				};
			};
			params: never;
			requiredID: false;
		};
		dirtybombs: {
			response: {
				dirtybombs: {
					planted: number;
					detonated: number;
					injured: number;
					respect: number;
					faction: number;
					user: number;
				};
			};
			params: "limit";
			requiredID: false;
		};
		education: {
			response: {
				education: {
					[id: string]: {
						name: string;
						description: string;
						code: string;
						money_cost: number;
						tier: number;
						duration: number;
						results: {
							perk: string[];
							manual_labor: string[];
							intelligence: string[];
							endurance: string[];
						};
						prerequisites: number[];
					};
				};
			};
			params: never;
			requiredID: true;
		};
		factiontree: {
			response: {
				factiontree: {
					[some_id: string]: {
						[level: string]: {
							branch:
								| "Core"
								| "Criminality"
								| "Fortitude"
								| "Voracity"
								| "Toleration"
								| "Excursion"
								| "Steadfast"
								| "Aggression"
								| "Suppression";
							name: string;
							ability: string;
							challenge: string;
							base_cost: number;
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		gyms: {
			response: {
				gyms: {
					[gym_id: string]: {
						name: string;
						stage: number;
						cost: number;
						energy: number;
						strength: number;
						speed: number;
						defense: number;
						dexterity: number;
						note: string;
					};
				};
			};
			params: never;
			requiredID: true;
		};
		honors: {
			response: {
				honors: {
					[id: string]: {
						name: string;
						description: string;
						type: number;
						circulation: number;
						equipped: string;
						rarity:
							| "Very Common"
							| "Common"
							| "Uncommon"
							| "Limited"
							| "Rare"
							| "Very Rare"
							| "Extremely Rare";
					};
				};
			};
			params: never;
			requiredID: true;
		};
		itemdetails: {
			response: {
				itemdetails: {
					ID: number;
					UID: number;
					name: string;
					type: string;
					rarity: "None" | "Yellow" | "Orange" | "Red";
					damage: number;
					accuracy: number;
					armor: number;
					quality: number;
					bonuses: {
						[bonus_id: string]: {
							bonus: string;
							description: string;
							value: number;
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		items: {
			response: {
				items: {
					[id: string]: {
						name: string;
						description: string;
						effect: string;
						requirement: string;
						type: string;
						weapon_type: string;
						buy_price: number;
						sell_price: number;
						market_value: number;
						circulation: number;
						image: string;
						tradeable: boolean;
						coverage: {
							"Full Body Coverage": number;
							"Heart Coverage": number;
							"Stomach Coverage": number;
							"Chest Coverage": number;
							"Arm Coverage": number;
							"Leg Coverage": number;
							"Groin Coverage": number;
							"Hand Coverage": number;
							"Foot Coverage": number;
							"Head Coverage": number;
							"Throat Coverage": number;
						};
					};
				};
			};
			params: never;
			requiredID: true;
		};
		itemstats: {
			response: {
				itemstats: {
					[id: string]: {
						ID: number;
						UID: number;
						name: string;
						type: string;
						market_price: number;
						stats: {
							damage: number;
							rounds_fired: number;
							hits: number;
							misses: number;
							reloads: number;
							highest_damage: number;
							finishing_hits: number;
							critical_hits: number;
							first_faction_owner: number;
							first_owner: number;
							time_created: number;
							respect_earned: number;
							damage_taken: number;
							hits_received: number;
							most_damage_taken: number;
							damage_mitigated: number;
							most_damage_mitigated: number;
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		logcategories: {
			response: { logcategories: { [id: string]: string } };
			params: never;
			requiredID: false;
		};
		logtypes: {
			response: { logtypes: { [id: string]: string } };
			params: never;
			requiredID: false;
		};
		lookup: {
			response: { selections: string[] };
			params: never;
			requiredID: false;
		};
		medals: {
			response: {
				medals: {
					[id: string]: {
						name: string;
						description: string;
						type: string;
						circulation: number;
						equipped: string;
						rarity:
							| "Very Common"
							| "Common"
							| "Uncommon"
							| "Limited"
							| "Rare"
							| "Very Rare"
							| "Extremely Rare";
					};
				};
			};
			params: never;
			requiredID: true;
		};
		organisedcrimes: {
			response: {
				organisedcrimes: {
					[id: string]: {
						name: string;
						members: number;
						time: number;
						min_cash: number;
						max_cash: number;
						min_respect: number;
						max_respect: number;
					};
				};
			};
			params: never;
			requiredID: true;
		};
		pawnshop: {
			response: {
				pawnshop: { points_value: number; donatorpack_value: number };
			};
			params: never;
			requiredID: false;
		};
		pokertables: {
			response: {
				pokertables: {
					[id: string]: {
						name: string;
						big_blind: number;
						small_blind: number;
						speed: number;
						current_players: number;
						maximum_players: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		properties: {
			response: {
				properties: {
					[id: string]: {
						name: string;
						cost: number | "";
						happy: number;
						upgrades_available: string[];
						staff_available: string[];
					};
				};
			};
			params: never;
			requiredID: true;
		};
		rackets: {
			response: {
				rackets: {
					[territory: string]: {
						name: string;
						level: number;
						reward: string;
						created: number;
						changed: number;
						faction: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		raidreport: {
			response: {
				raidreport: {
					war: { start: number; end: number };
					factions:
						| {
								[faction_id_1: string]: {
									name: string;
									type: "aggressor" | "defender";
									score: number;
									attacks: number;
									members: {
										[user_id: string]: {
											name: string;
											level: number;
											faction_id: number;
											attacks: number;
											damage: number;
										};
									};
								};
						  }
						| {
								[faction_id_2: string]: {
									name: string;
									type: "aggressor" | "defender";
									score: number;
									attacks: number;
									members: {
										[user_id: string]: {
											name: string;
											level: number;
											faction_id: number;
											attacks: number;
											damage: number;
										};
									};
								};
						  };
				};
			};
			params: never;
			requiredID: false;
		};
		raids: {
			response: {
				raids: {
					[id: string]: {
						assaulting_faction: number;
						defending_faction: number;
						assaulting_score: number;
						defending_score: number;
						started: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		rankedwarreport: {
			response: {
				rankedwarreport: {
					factions:
						| {
								[faction_id_1: string]: {
									name: string;
									score: number;
									attacks: number;
									rank_before: string;
									rank_after: string;
									rewards: {
										respect: number;
										points: number;
										items: {
											[item_id: string]: { name: string; quantity: number };
										};
									};
									members: {
										[user_id: string]: {
											name: string;
											faction_id: number;
											level: number;
											attacks: number;
											score: number;
										};
									};
								};
						  }
						| {
								[faction_id_2: string]: {
									name: string;
									score: number;
									attacks: number;
									rank_before: string;
									rank_after: string;
									rewards: {
										respect: number;
										points: number;
										items: {
											[item_id: string]: { name: string; quantity: number };
										};
									};
									members: {
										[user_id: string]: {
											name: string;
											faction_id: number;
											level: number;
											attacks: number;
											score: number;
										};
									};
								};
						  };
					war: { start: number; end: number; winner: number; forfeit: 0 | 1 };
				};
			};
			params: never;
			requiredID: false;
		};
		rankedwars: {
			response: {
				rankedwars: {
					[war_id: string]: {
						factions: {
							[faction_id: string]: {
								name: string;
								score: number;
								chain: number;
							};
						};
						war: { start: number; end: number; target: number; winner: number };
					};
				};
			};
			params: never;
			requiredID: false;
		};
		rockpaperscissors: {
			response: {
				rockpaperscissors: {
					type: "rock" | "paper" | "scissors";
					count: number;
				};
			};
			params: never;
			requiredID: false;
		};
		searchforcash: {
			response: {
				searchforcash: {
					[subcrime_name: string]: { title: string; percentage: number };
				};
			};
			params: never;
			requiredID: false;
		};
		shoplifting: {
			response: {
				shoplifting: {
					[subcrime_name: string]: { title: string; disabled: boolean };
				};
			};
			params: never;
			requiredID: false;
		};
		stats: {
			response: {
				stats: {
					timestamp: number;
					users_total: number;
					users_male: number;
					users_female: number;
					users_enby: number;
					users_marriedcouples: number;
					users_daily: number;
					total_users_logins: number;
					total_users_playtime: number;
					job_army: number;
					job_grocer: number;
					job_medical: number;
					job_casino: number;
					job_education: number;
					job_law: number;
					job_company: number;
					job_none: number;
					crimes: number;
					jailed: number;
					money_onhand: number;
					money_citybank: number;
					items: number;
					events: number;
					wars_ranked: number;
					wars_territory: number;
					wars_raid: number;
					communication_events: number;
					communication_totalevents: number;
					communication_messages: number;
					communication_totalmessages: number;
					communication_chats: number;
					communication_forumposts: number;
					communication_articles: number;
					communication_articleviews: number;
					communication_articlereads: number;
					forums_posts: number;
					forums_threads: number;
					forums_likes: number;
					forums_dislikes: number;
					crimes_today: number;
					gym_trains: number;
					points_total: number;
					points_market: number;
					points_averagecost: number;
					points_bought: number;
					points_used: number;
					points_held_by_factions: number;
					points_held_by_users: number;
					total_points_boughttotal: number;
					total_attacks_won: number;
					total_attacks_lost: number;
					total_attacks_stalemated: number;
					total_attacks_runaway: number;
					total_attacks_hits: number;
					total_attacks_misses: number;
					total_attacks_criticalhits: number;
					total_attacks_roundsfired: number;
					total_attacks_stealthed: number;
					total_attacks_moneymugged: number;
					total_attacks_respectgained: number;
					total_items_marketbought: number;
					total_items_bazaarbought: number;
					total_items_auctionswon: number;
					total_items_sent: number;
					total_trades: number;
					total_items_bazaarincome: number;
					total_items_cityfinds: number;
					total_items_dumpfinds: number;
					total_items_dumped: number;
					total_jail_jailed: number;
					total_jail_busted: number;
					total_jail_busts: number;
					total_jail_bailed: number;
					total_jail_bailcosts: number;
					total_hospital_trips: number;
					total_hospital_medicalitemsused: number;
					total_hospital_revived: number;
					total_mails_sent: number;
					total_mails_sent_friends: number;
					total_mails_sent_faction: number;
					total_mails_sent_company: number;
					total_mails_sent_spouse: number;
					total_classifiedads_placed: number;
					total_bounty_placed: number;
					total_bounty_rewards: number;
					total_travel_all: number;
					total_travel_argentina: number;
					total_travel_mexico: number;
					total_travel_dubai: number;
					total_travel_hawaii: number;
					total_travel_japan: number;
					total_travel_unitedkingdom: number;
					total_travel_southafrica: number;
					total_travel_switzerland: number;
					total_travel_china: number;
					total_travel_canada: number;
					total_travel_caymanislands: number;
					total_drugs_used: number;
					total_drugs_overdosed: number;
					total_drugs_cannabis: number;
					total_drugs_ecstacy: number;
					total_drugs_ketamine: number;
					total_drugs_lsd: number;
					total_drugs_opium: number;
					total_drugs_shrooms: number;
					total_drugs_speed: number;
					total_drugs_pcp: number;
					total_drugs_xanax: number;
					total_drugs_vicodin: number;
					total_merits_bought: number;
					total_refills_bought: number;
					total_company_trains: number;
					total_statenhancers_used: number;
				};
			};
			params: "timestamp";
			requiredID: false;
		};
		stocks: {
			response: {
				stocks: {
					[id: string]: {
						stock_id: number;
						name: string;
						acronym: string;
						current_price: number;
						market_cap: number;
						total_shares: number;
						investors: number;
						benefit: {
							type: "active" | "passive";
							frequency: number;
							requirement: number;
							description: string;
						};
						last_hour: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						last_day: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						last_week: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						last_month: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						last_year: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						all_time: {
							change: number;
							change_percentage: number;
							start: number;
							end: number;
							high: number;
							low: number;
						};
						history: { timestamp: number; price: number; change: number };
					};
				};
			};
			params: never;
			requiredID: true;
		};
		territory: {
			response: {
				territory: {
					[territory: string]: {
						sector: number;
						size: number;
						density: number;
						slots: number;
						daily_respect: number;
						faction: number;
						coordinate_x: string;
						coordinate_y: string;
						neighbors: string[];
						racket: {
							name: string;
							level: number;
							reward: string;
							created: number;
							changed: number;
						};
						war: {
							territory_war_id: number;
							assaulting_faction: number;
							defending_faction: number;
							score: number;
							required_score: number;
							started: number;
							ends: number;
						};
					};
				};
			};
			params: never;
			requiredID: false;
		};
		territorynames: {
			response: { territoryNames: string[] };
			params: never;
			requiredID: false;
		};
		territorywarreport: {
			response: {
				territorywarreport: {
					factions:
						| {
								[faction_id_1: string]: {
									name: string;
									type: "aggressor" | "defender";
									score: number;
									joins: number;
									clears: number;
									members: {
										[user_id: string]: {
											name: string;
											level: number;
											faction_id: number;
											points: number;
											joins: number;
											clears: number;
										};
									};
								};
						  }
						| {
								[faction_id_2: string]: {
									name: string;
									type: "aggressor" | "defender";
									score: number;
									joins: number;
									clears: number;
									members: {
										[user_id: string]: {
											name: string;
											level: number;
											faction_id: number;
											points: number;
											joins: number;
											clears: number;
										};
									};
								};
						  };
					territory: { name: string };
					war: {
						end: number;
						result:
							| "success_assault"
							| "fail_assault"
							| "end_with_peace_treaty";
						start: number;
						winner: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		territorywars: {
			response: {
				territorywars: {
					[territory: string]: {
						territory_war_id: number;
						assaulting_faction: number;
						defending_faction: number;
						score: number;
						required_score: number;
						started: number;
						ends: number;
					};
				};
			};
			params: never;
			requiredID: false;
		};
		timestamp: {
			response: { timestamp: number };
			params: never;
			requiredID: false;
		};
	};
}
export interface Key extends BaseSchema {
	selections: {
		info: {
			response: {
				access_level: "0" | "1" | "2" | "3" | "4";
				access_type:
					| "Custom"
					| "Public Only"
					| "Minimal Access"
					| "Limited Access"
					| "Full Access";
				selections: {
					company: string[];
					faction: string[];
					market: string[];
					property: string[];
					torn: string[];
					user: string[];
					key: string[];
				};
			};
			params: never;
			requiredID: false;
		};
	};
}
export interface SectionsMap {
	user: User;
	property: Property;
	faction: Faction;
	company: Company;
	market: Market;
	torn: Torn;
	key: Key;
}
export type Section = keyof SectionsMap;
export interface DefaultSelectionsMap {
	user: SectionsMap["user"]["defaultSelection"];
	property: SectionsMap["property"]["defaultSelection"];
	faction: SectionsMap["faction"]["defaultSelection"];
	company: SectionsMap["company"]["defaultSelection"];
	market: SectionsMap["market"]["defaultSelection"];
	torn: SectionsMap["torn"]["defaultSelection"];
	key: SectionsMap["key"]["defaultSelection"];
}
export type Selection<Sec extends Section> =
	keyof SectionsMap[Sec]["selections"];
export type Params<
	Sec extends Section,
	Sel extends keyof SectionsMap[Sec]["selections"],
> = SectionsMap[Sec]["selections"][Sel] extends { params: any }
	? SectionsMap[Sec]["selections"][Sel]["params"]
	: never;
export type GetArgument<
	Sec extends Section,
	Sel extends keyof SectionsMap[Sec]["selections"],
> = Params<Sec, Sel> extends never
	? {
			section: Sec;
			selections?: Sel[];
			id?: string | number;
			params?: never;
			key: string;
			comment?: string;
		}
	: {
			section: Sec;
			selections?: Sel[];
			id?: string | number;
			params?: Partial<Record<Params<Sec, Sel>, string>>;
			key: string;
			comment?: string;
		};
export type GetResponseSuccess<
	Sec extends Section,
	Sel extends keyof SectionsMap[Sec]["selections"],
> = SectionsMap[Sec]["selections"][Sel] extends { response: any }
	? UnionToIntersection<SectionsMap[Sec]["selections"][Sel]["response"]>
	: never;
export type GetResponseError = { error: { code: TornApiError; error: string } };
export type GetResponse<
	Sec extends Section,
	Sel extends keyof SectionsMap[Sec]["selections"],
> = GetResponseSuccess<Sec, Sel> | GetResponseError;
export enum TornApiError {
	UNKNOWN_ERROR = 0,
	KEY_EMPTY = 1,
	INCORRECT_KEY = 2,
	WRONG_TYPE = 3,
	WRONG_FIELDS = 4,
	TOO_MANY_REQUESTS = 5,
	INCORRECT_ID = 6,
	INCORRECT_RELATION = 7,
	IP_BLOCK = 8,
	API_DISABLED = 9,
	KEY_OWNER_FEDERAL = 10,
	KEY_CHANGE_ERROR = 11,
	KEY_READ_ERROR = 12,
	KEY_TEMPORARILY_DISABLED = 13,
	DAILY_READ_LIMIT = 14,
	TEMPORARY_ERROR = 15,
	ACCESS_LEVEL_KEY = 16,
	BACKEND_ERROR_OCCURRED = 17,
	API_KEY_HAS = 18,
	MUST_BE_MIGRATED = 19,
	RACE_NOT_YET = 20,
	INCORRECT_CATEGORY = 21,
}
export type Cache<
	Sec extends Section,
	Sel extends keyof SectionsMap[Sec]["selections"],
> = {
	get: (
		key: GetArgument<Sec, Sel>,
	) => GetResponse<Sec, Sel> | null | Promise<GetResponse<Sec, Sel> | null>;
	/** @param expiry {string} an epoch timestamp, in ms  */
	set: (
		key: GetArgument<Sec, Sel>,
		value: GetResponse<Sec, Sel>,
		expiry: number,
	) => void | Promise<void>;
};
export async function tornApiGet<
	Sec extends Section,
	Sel extends Selection<Sec>,
>({
	section,
	selections,
	id,
	params = {} as any,
	key,
	comment,
	cache,
	expiry,
}: GetArgument<Sec, Sel> & {
	cache?: Cache<Sec, Sel>;
	expiry?: number;
}): Promise<GetResponse<Sec, Sel>> {
	const cached = await cache?.get({
		section,
		selections,
		id,
		params,
		key,
	} as GetArgument<Sec, Sel>);
	if (cached) return cached;
	const url = new URL(`https://api.torn.com/${section}/${id ?? ""}`);
	selections?.length &&
		url.searchParams.set("selections", selections.join(","));
	url.searchParams.set("key", key);
	if (comment) url.searchParams.set("comment", comment);
	Object.entries<string>(params as any).forEach(([k, v]) =>
		url.searchParams.set(k, v),
	);
	return await fetch(url)
		.then((res) => res.json())
		.then(addToCache)
		.catch(handleError);
	function handleError(e: unknown) {
		console.error(e);
		return { error: { code: -1, error: generateErrorString(e) } };
		function generateErrorString(e: unknown): string {
			switch (typeof e) {
				case "string":
					return e;
				case "object": {
					if (e instanceof Error) return e.message;
					return JSON.stringify(e);
				}
				default:
					return (e as any).toString();
			}
		}
	}
	function addToCache(response: GetResponse<Sec, Sel>): GetResponse<Sec, Sel> {
		if ("error" in (response as any)) return response;
		cache?.set(
			{ section, selections, id, params, key } as GetArgument<Sec, Sel>,
			response,
			expiry ?? Date.now() + 30_000,
		);
		return response;
	}
}
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
	x: infer I,
) => void
	? I
	: never;
