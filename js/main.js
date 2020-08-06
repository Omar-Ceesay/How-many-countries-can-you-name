function convertRange( value, r1, r2 ) { 
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

$(function(){
    let cityData = null;
    let cityIndex = localStorage.getItem("cityIndex") === null ? 0 : Number.parseInt(localStorage.getItem("cityIndex"));
    let totalPopulation = localStorage.getItem("totalPopulation") === null ? 0 : Number.parseInt(localStorage.getItem("totalPopulation"));
    let halfAMillion = localStorage.getItem("halfAMillion") === null ? 0 : Number.parseInt(localStorage.getItem("halfAMillion"));
    let million = localStorage.getItem("million") === null ? 0 : Number.parseInt(localStorage.getItem("million"));
    let tenMillion = localStorage.getItem("tenMillion") === null ? 0 : Number.parseInt(localStorage.getItem("tenMillion"));
    let markers = localStorage.getItem("markers") === null ? [] : JSON.parse(localStorage.getItem("markers"));
    let pops = localStorage.getItem("popValues") === null ? [] : JSON.parse(localStorage.getItem("popValues"));
    let biggest = localStorage.getItem("biggest") === null ? [] : JSON.parse(localStorage.getItem("biggest"));
    let smallest = localStorage.getItem("smallest") === null ? [] : JSON.parse(localStorage.getItem("smallest"));
    let citiesIdentified = localStorage.getItem("citiesIdentified") === null ? [] : JSON.parse(localStorage.getItem("citiesIdentified"));
    let countryCount = [];
    var palette = ['#fbc17b', '#f4f3cd', '#81a6aa', '#a6c8c7', 
                    '#c89fa5', '#9fa9be', '#ffdb58', '#ffc5bb',
                    '#ffc5bb', '#c3d825', '#bbffff', '#68be8d',
                    '#a1d7c9', '#ba53de', '#43dde6'];

    // * initial setup
    loadStats();
    $("#total-population").text("Total population: "+Number(totalPopulation).toLocaleString());
    markers.forEach((city) => {
        $("#city-list").prepend($("<li>").text(city.name))
    })


    // * Input setup
    var input = document.getElementById("name-input");
    input.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          // Trigger the button element with a click
          document.getElementById("name-input-submit").click();
        }
    });
    generateColors = function(){
    var colors = {},
        key;

    for (key in map.regions) {
        colors[key] = palette[Math.floor(Math.random()*palette.length)];
    }
    return colors;
    }, map;
    var map = new jvm.Map({
        map: 'world_mill',
        markerStyle: {
            initial: {
                fill: 'red',
                "fill-opacity": 0.5,
            },
            hover: {
                "stroke-width": 1.5
            }
        },
        series: {
            regions: [{
                attribute: 'fill'
            }],
            markers: [{
                attribute: 'r',
                values: pops
            }]
        },
        container: $('#world-map'),
        onMarkerClick: function(e, code){
        },
        markers: markers
    });
    // * Uncomment to add colors to regions
    // map.series.regions[0].setValues(generateColors());

    fetch("cities.json")
    .then(response => response.json())
    .then((data) => {
        cityData = data
        console.log(cityData.length)
    });

    async function checkForCity(city, list) {
        if(city === undefined) return false;
        testList = await list.filter((elem) => {
            return elem.geonameid === city.geonameid 
        })
        return testList.length > 0
    }

    function addMarker(city) {
        let marker, name;
        if (city["country-code"] !== "US") {
            name = city.name+", "+city["country-code"] + " (" + Number(city.population).toLocaleString() + ")";
        } else {
            name = city.name+", "+city["admin1-code"] + " (" + Number(city.population).toLocaleString() + ")";
        }
        marker = {latLng: [city.latitude, city.longitude], name: name}
        $("#city-list").prepend($("<li>").text(name))
        markers.push(marker)
        map.addMarker(cityIndex, marker)
        localStorage.setItem("markers", JSON.stringify(markers))
        cityIndex++;
        localStorage.setItem("cityIndex", cityIndex)
    }

    function loadStats() {
        $("#smallest-list").html("")
        smallest.forEach(elem => {
            code = (elem["country-code"] === "US") ? elem["admin1-code"] : elem["country-code"]
            name = elem.name+", "+ code + " (" + Number(elem.population).toLocaleString() + ")";
            $("#smallest-list").append($("<li>").text(name))
        })
        $("#biggest-list").html("")
        biggest.forEach(elem => {
            code = (elem["country-code"] === "US") ? elem["admin1-code"] : elem["country-code"]
            name = elem.name+", "+ code + " (" + Number(elem.population).toLocaleString() + ")";
            $("#biggest-list").append($("<li>").text(name))
        })
        $("#half-a-million").text(halfAMillion)
        $("#million").text(million)
        $("#ten-million").text(tenMillion)
    }

    async function addCities(cities) {
        let cityAlreadyExists = await checkForCity(cities[0], citiesIdentified);
        if (cities.length !== 0 && cities[0] != null && !cityAlreadyExists) {
            $("#name-input").addClass("valid")
            setTimeout(() => {
                $("#name-input").removeClass("valid")
            }, 750)
            cities.forEach(async (city) => {
                console.log(city)
                pops.push(convertRange(city.population, [100, 10000000], [2, 15]));
                localStorage.setItem("popValues", JSON.stringify(pops))
                citiesIdentified.push(city)
                localStorage.setItem("citiesIdentified", JSON.stringify(citiesIdentified))
                addMarker(city)

                // * inc country count
                const lookForCountry = countryCount.findIndex(elem => elem.countryCode === city["country-code"])
                if (lookForCountry === -1) {
                    countryCount.push({ countryCode: city["country-code"], count: 1 });
                } else {
                    countryCount[lookForCountry].count++;
                }

                totalPopulation += city.population;
                localStorage.setItem("totalPopulation", totalPopulation)
                $("#total-population").text("Total population: "+Number(totalPopulation).toLocaleString());
                map.series.markers[0].setValues(pops)

                // * Check and add to biggest list
                biggest.push(city)
                biggest.sort((a, b) => {
                    return b.population - a.population
                })
                if (biggest.length > 5) {
                    biggest.pop()
                }
                localStorage.setItem("biggest", JSON.stringify(biggest))
                
                // * Check and add to smallest list
                smallest.push(city)
                smallest.sort((a, b) => {
                    return a.population - b.population
                })
                if (smallest.length > 5) {
                    smallest.pop()
                }
                localStorage.setItem("smallest", JSON.stringify(smallest))
                
                // * Update other stats
                updateOtherStats = true;
                if (city.population > 10000000) {
                    tenMillion++;
                    million++;
                    halfAMillion++;
                } else if (city.population > 1000000) {
                    million++;
                    halfAMillion++;
                } else if (city.population > 500000) {
                    halfAMillion++;
                } else updateOtherStats = false;

                localStorage.setItem("halfAMillion", halfAMillion)
                localStorage.setItem("million", million)
                localStorage.setItem("tenMillion", tenMillion)
                loadStats();

            })
        } else {
            if (cityAlreadyExists) {
                $("#name-input").addClass("already-entered")
                setTimeout(() => {
                    $("#name-input").removeClass("already-entered")
                }, 750)
            } else {
                $("#name-input").addClass("invalid")
                setTimeout(() => {
                    $("#name-input").removeClass("invalid")
                }, 750)
            }
        }
    }

    $("#name-input-submit").click(async () => {
        const val = $(input).val().trim();
        if(val.length < 1) {
    
        } else {
            // * position is -1 if "," is not found
            const position = val.search(",");
            if(position !== -1) {
                let countryCode = val.slice(position+1, val.length).trim()
                let cityName = val.slice(0, position).trim()

                cities = await cityData.filter((city) => {
                    if (city.name == null || city.name.length < 1) {
                        console.log(city)
                    } else {
                        return (city.name.toLowerCase() === cityName.toLowerCase() 
                                && (city["country-code"] === countryCode.toUpperCase() || city["admin1-code"] === countryCode.toUpperCase()));
                    }
                })

                await cities.sort((a, b) => {
                    return a.population - b.population
                })

                addCities([cities[cities.length-1]])
                $(input).val("")
            } else {

                cities = await cityData.filter((city) => {
                    if (city.name == null || city.name.length < 1) {
                        console.log(city)
                    } else {
                        return city.name.toLowerCase() === val.toLowerCase();
                    }
                })
    
                await cities.sort((a, b) => {
                    return a.population - b.population
                })
    
                addCities([cities[cities.length-1]])
                $(input).val("")
            }
        }
    })

    $("#clear-board").click(() => {
        if (confirm("Are you sure you want to clear all of your progress?\nThere's no going back!")) {
            cityIndex = 0, totalPopulation = 0, halfAMillion = 0, million = 0, tenMillion = 0, markers = [], pops = [], biggest = [], smallest = [], citiesIdentified = []        
            localStorage.clear()
            $("#half-a-million").text("0")
            $("#million").text("0")
            $("#ten-million").text("0")
            $("#biggest-list").empty()
            $("#smallest-list").empty()
            $("#city-list").empty()
            $("#total-population").text("Total population: 0")
            map.removeAllMarkers()
        }
    })

});