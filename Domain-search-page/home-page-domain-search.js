<script>
window.Webflow?.push(async () => {
  try {
    let errorDiv;
    let successDiv;
    const domainForm = document.getElementById('hpDomainForm');
    console.log(domainForm);

    if (domainForm && domainForm.parentElement) {
      domainForm.parentElement.classList.remove('w-form');
      domainForm.style.display = 'block';

      // 2. Find the error and success divs
      errorDiv = domainForm.parentElement.querySelector('[data-hpDomainForm="error"]');
      console.log('errorDiv', errorDiv);

      successDiv = domainForm.parentElement.querySelector('[data-hpDomainForm="success"]');
      console.log('successDiv', successDiv);

      if (errorDiv) errorDiv.style.display = 'none';
      if (successDiv) successDiv.style.display = 'none';

      // 3. Add our own submit handler
      domainForm.onsubmit = async (event) => {
        try {
          //console.log('onsubmit')
          event.preventDefault();

          // 4. Get the form data
          const formData = new FormData(domainForm);
          console.log(formData);

          // 5. Get the form entries as an object
          const input = Object.fromEntries(formData.entries());
          console.log('Form data', input);
          const domain = input.name2;
          console.log('Domain: ', domain);

          // Validate domain name
          const isValidDomain = validateDomain(domain);
          if (!isValidDomain) {
            if (!errorDiv) {
              // Create errorDiv dynamically if not found
              errorDiv = document.createElement('div');
              errorDiv.setAttribute('data-hpDomainForm', 'error');
              errorDiv.style.color = 'red'; // Customize as needed
              domainForm.parentElement.appendChild(errorDiv);
            }
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Invalid domain name. Please enter a valid domain.';
            return;
          }

          let apiUrl = `https://api.datazag.com/api/${domain}`;
          //let apiUrl = url.replace(/%22/g, '');
          console.log(apiUrl);

          // 6. Send the data to the server
          const response = await fetch(apiUrl);
          console.log('Response status', response.status);
          const responseData = await response.json();

          console.log('responseData', responseData.mx);

          // Store the API results in Session Storage
          sessionStorage.setItem('apiResults', JSON.stringify(responseData));
          // Store the initial query in case you want to display it on the second page
          sessionStorage.setItem('initialQuery', domain);
          console.log("Saved");

          // Redirect to the second page
          window.location.href = 'domain-search';
        } catch (error) {
          console.error('Error occurred:', error);
        }
      };
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
});

function validateDomain(domain) {
  const domainPattern = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}$/;
  return domainPattern.test(domain);
}
</script>