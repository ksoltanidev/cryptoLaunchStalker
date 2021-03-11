var xhr = new XMLHttpRequest();
const table = document.getElementById("table");

xhr.open('GET', '/trades', true);

xhr.onreadystatechange = function (result) {
    // Requête finie, traitement ici.
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log(this.responseText);
        let data = JSON.parse(this.responseText);
        data.trades.forEach(item => {
            let row = table.insertRow();
            row.insertCell(0).innerHTML = item.owner;
            row.insertCell(1).innerHTML = item.order.symbol;
            row.insertCell(2).innerHTML = item.order.origQty;
            row.insertCell(3).innerHTML = item.order.executedQty;
            row.insertCell(4).innerHTML = item.order.cummulativeQuoteQty;
            row.insertCell(5).innerHTML = item.order.status;
            row.insertCell(6).innerHTML = item.date;
            row.insertCell(7).innerHTML = item.trigger;
        });
    }
};

xhr.send(null);