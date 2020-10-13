//initiate when page reload
(function init(){
  window.localStorage.clear();
  document.getElementById("amount").value = "";
  document.getElementById("apr").value = "";
  document.getElementById("years").value = "";
  document.getElementById("zipcode").value = "";
  document.getElementById("lenders").innerHTML="";
});


//calculate function
let calculate =()=> {
  let amount = document.getElementById("amount");
  let apr = document.getElementById("apr");
  let years = document.getElementById("years");
  let zipcode = document.getElementById("zipcode");
  let payment = document.getElementById("payment");
  let total = document.getElementById("total");
  let totalinterest = document.getElementById("totalinterest");
  //parse string to float
  let principal = parseFloat(amount.value);
  let interest = parseFloat(apr.value) / 100 / 12;
  let payments = parseFloat(years.value) * 12;
  // compute the monthly payment 
  let x = Math.pow(1 + interest, payments); 
  let dfactor = (x - 1) / (interest * x);
  let monthly = principal / dfactor;

  if (validator(principal,interest,payments,zipcode.value))
  {
    //displays the results in <span> elements
    payment.innerHTML = (monthly).toFixed(2);
    total.innerHTML = (monthly * payments).toFixed(2);
    totalinterest.innerHTML = ((monthly*payments)-principal).toFixed(2);
    //Save the user's input
    save(amount.value, apr.value, years.value, zipcode.value);
    //find and display local lenders
    getLenders(amount.value, apr.value, years.value, zipcode.value);
    //chart loan balance, and interest and equity payments
    //chart(principal, interest, monthly, payments);
    plotting(principal, monthly, payments,interest);
  }else{
    //if validation is false
    payment.innerHTML = ""; 
    total.innerHTML = ""
    totalinterest.innerHTML = "";
    //alert for wrong invalid input
    alert("Invalid input, please try again.");
    //With no arguments, clears the chart
    plotting();
  }
}

//Validator functions
let validator= (loan, rate, pay, zip)=>{
  if(isNaN(loan) || loan < 0){
    return false;
  }
  if(isNaN(rate) || rate < 0 || rate > 1/12){
    return false;
  }
  if(isNaN(pay) || pay < 0){
    return false;
  }
  if(!isValidUSZip(zip)){
    return false;
  }
  return true;
}

let isValidUSZip = (zip)=> {
  return /^[0-9]{5}(?:-[0-9]{4})?$/.test(zip);
}

// Save function
let save = (amount, apr, years, zipcode)=> {
  if (!window.localStorage) {
    localStorage.setItem("loan_amount", amount);
    localStorage.setItem("loan_apr", apr);
    localStorage.setItem("loan_years", years);
    localStorage.setItem("loan_zipcode", zipcode);
  }
}

//reset function
let reset = ()=>{
  document.getElementById("amount").value = "";
  document.getElementById("apr").value = "";
  document.getElementById("years").value = "";
  document.getElementById("zipcode").value = "";
  document.getElementById("payment").innerHTML = "";
  document.getElementById("total").innerHTML = "";
  document.getElementById("totalinterest").innerHTML = "";
  document.getElementById("lenders").innerHTML="";
  plotting();
}

function getRequest() {
  var request;
    if(window.XMLHttpRequest){
        request  = new XMLHttpRequest();
    }else{
        request = new ActiveXObject();
    }
   return request;
};
//request data from JSON file (mock database)
//In this function, I only check apr and zipcode for filtering
//because the mock database(JSON file) is small.
//Either apr or zipcode match user's input, website will show lender's link to user.
let getLenders = (amount, apr, years, zipcode)=>{
  let hasResult = false;
  let xhr = getRequest();
  xhr.open('GET', 'data.json');
  xhr.onreadystatechange = ()=>{
    if(xhr.readyState === 4 && xhr.status === 200){//check if the request is complete and successful
      let items = JSON.parse(xhr.responseText);
      let htmlContent = '<ul>';
      for(let i=0; i<items.length; i++){
        //check if there are any lenders matching the inputs.
        if(items[i].zipcode === zipcode || items[i].rate === apr){
          hasResult = true;
          htmlContent += `<li>
          <h3><a href= ${items[i].website}>${items[i].name}</a></h3>
          </li>`;
        }
      }
      //if no result, display message.
      if(!hasResult){
        htmlContent += "No lenders found, please try again."
      }
      htmlContent += '</ul>';

      document.querySelector('#lenders').innerHTML = htmlContent;
    }
   
  } 
  xhr.send();
}

//Plotting function
function plotting (principal, monthly, payments, interest){
  const ctx = document.getElementById("testing").getContext('2d');
  //Data for month (y-axis)
  let monthCount=(month)=>{
      let numyear = month/12;
      let labeldata = [];
      for (let i=0; i <= numyear; i++){
        labeldata.push(i);
      }
      return labeldata.map(String);
  };
  //Data for TotalBalance
  let TotalBalanceData = (month, pay)=>{
      let totalData = [];
      let mPayment = 0;
      for (let i=0; i <= month; i++){
        if(i==0){
          totalData.push(mPayment);
          continue;
        }
        mPayment += pay;
      
        if( i%12==0){
          totalData.push(mPayment);
        }
      }
      return totalData;
  }
  //Data for LoanBalance
  let LoanBalanceData =(totalLoan, month, pay, intest)=>{
      let loan = totalLoan;
      let loanData = [];
      for (let i=0; i <= month; i++){
          if(i==0){
            loanData.push(loan);
            continue;
          }
          let thisMonthInterest = loan*intest;
          loan = loan - (pay - thisMonthInterest);
          if(loan < 0){
            loan = 0;
          }
          if( i%12==0){
            loanData.push(loan);
          }
      }
      return loanData;
  }
  //Data for Cumculative Equity
  let EquityData =(totalLoan, month, pay, intest)=>{
    let loan = totalLoan;
    let equityData = [];
    let equity = 0;
    for (let i=0; i <= month; i++){
        if(i==0){
          equityData.push(equity);
          continue;
        }
        let thisMonthInterest = (loan-equity)*intest;
        equity += (pay - thisMonthInterest); 
        if( i%12==0){
          equityData.push(equity);
        }
    }
    return equityData;
}

  //Plotting object by using Chart.js
  const chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',
      // The data for our dataset
      data: {
          labels: monthCount(payments),
          datasets: [
            {
              label: 'Total Payment',
              fill: false,
              backgroundColor: 'rgb(75,192,192,0.4)',
              borderColor: 'rgb(75,192,192,1)',
              data: TotalBalanceData(payments, monthly),
            },
            {
              label: 'Loan Balance',
              fill: false,
              backgroundColor: 'rgb(102,204,0,0.4)',
              borderColor: 'rgb(102,204,0,1)',
              data: LoanBalanceData(principal,payments,monthly,interest),
            },
            {
              label: 'Cumculative Equity',
              fill: false,
              backgroundColor: 'rgb(255,153,3.5,0.4)',
              borderColor: 'rgb(255,153,3.5,1)',
              data: EquityData(principal,payments,monthly,interest),
            }
          
          ],
      },
      // Configuration options
      options: {
        title: {
          display: true,
          text: 'Loan Balance, Cumulative Equity, and Interest Payments',
          fontSize: 15,
          fontColor: '#000'
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Year',
              fontSize: 15
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Amount($)',
              fontSize: 15
            }
          }]
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      }
  });
  //clear the plot if no parameters called in the function
  if (arguments.length == 0){
    chart.destroy();
    chart = null;
  }

}