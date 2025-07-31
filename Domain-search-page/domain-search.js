<script>
  document.addEventListener('DOMContentLoaded', function () {
    let storedResults = sessionStorage.getItem('apiResults');
    if (storedResults && storedResults !== '[object Object]') {
  		setTimeout(() => {
    		displayStoredResults();
    		sessionStorage.removeItem('apiResults');
    		sessionStorage.removeItem('initialQuery');
  		}, 300);
    }
    setupFormSubmitListener();
  });
      function displayStoredResults() {
          const storedQuery = sessionStorage.getItem('initialQuery');
          const storedResults = JSON.parse(sessionStorage.getItem('apiResults'));
          console.log("Stored query: ", storedQuery);
          console.log("Stored Results: ", storedResults);
          if (storedQuery && storedResults) {
              // Display results if coming from the first page with stored data
              updateResultsDisplay(storedResults);
          }
      }

      function setupFormSubmitListener() {
      	const domainForm = document.getElementById('domain-form');
      	if (!domainForm || !domainForm.parentElement) return;

      	domainForm.style.display = 'block';

        let errorDiv = domainForm.parentElement.querySelector('[data-form="error"]');
        if (!errorDiv) {
          errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-form', 'error');
          errorDiv.style.color = 'red';
          errorDiv.style.display = 'none';
          domainForm.parentElement.appendChild(errorDiv);
        }

        domainForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          
          const formData = new FormData(domainForm);
          const input = Object.fromEntries(formData.entries());
          const domain = input.name || input.name2;

          if (!validateDomain(domain)) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Invalid domain name. Please enter a valid domain.';
            return;
          }

          try {
            const apiUrl = `https://api.datazag.com/api/${domain}`;
            const response = await fetch(apiUrl, { method: 'GET' });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();

            updateResultsDisplay(responseData);

        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        // Optional: Comment out to keep the input value after submit
        // domainForm.reset();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        errorDiv.style.display = 'block';
        errorDiv.textContent = `Error: ${error.message}`;
      }
    });
  }
      
      function validateDomain(domain) {
          const domainPattern = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}$/;
          return domainPattern.test(domain);
      }

      function displayStoredResults() {
      const storedQuery = sessionStorage.getItem('initialQuery');
      const storedResultsRaw = sessionStorage.getItem('apiResults');
      try {
        const storedResults = JSON.parse(storedResultsRaw);
        console.log("Stored query: ", storedQuery);
        console.log("Stored Results: ", storedResults);

        if (storedQuery && storedResults) {
          updateResultsDisplay(storedResults);
        }
      } catch (e) {
        console.error('Error parsing stored API results:', e);
      }
    }

      function updateResultsDisplay(data) {
          const set = (id, value, style = {}) => {
            const el = document.getElementById(id);
            if (el) {
              el.textContent = value;
              Object.assign(el.style, style);
            }
          };

          const apiResults = document.getElementById('api-results');
          if (apiResults) apiResults.style.display = 'block';

          const yesStyle = { color: '#222' };
          const safeStyle = { color: '#fbfdfb', backgroundColor: '#bfd6f5' };
          const warnStyle = { color: '#fbfdfb', backgroundColor: '#f27108' };
          const dangerStyle = { color: '#fbfdfb', backgroundColor: '#ed1f1f' };

          // Flags
          const flags = [
            { key: 'is_phishing', id1: 'phishing1', id2: 'phishing2', labels: ['Yes', 'High Risk'], alt: ['No', 'Safe'], style: dangerStyle },
            { key: 'is_malware', id1: 'malware1', id2: 'malware2', labels: ['Yes', 'High Risk'], alt: ['No', 'Safe'], style: dangerStyle },
            { key: 'is_disposable', id1: 'disposable1', id2: 'disposable2', labels: ['Yes', 'High Risk'], alt: ['No', 'Safe'], style: dangerStyle },
            { key: 'is_parked', id1: 'parked1', id2: 'parked2', labels: ['Yes', 'High Risk'], alt: ['No', 'Uncertain'], style: dangerStyle },
            { key: 'is_mailable', id1: 'mailable1', id2: 'mailable2', labels: ['Yes', 'Safe'], alt: ['No', 'Email Risk'], style: warnStyle },
            { key: 'is_spf_block', id1: 'spfblock1', id2: 'spfblock2', labels: ['Yes', 'Blocked'], alt: ['No', 'Safe'], style: dangerStyle },
            { key: 'is_trusted_mbp', id1: 'trustedmbp1', id2: 'trustedmbp2', labels: ['Yes', 'Safe'], alt: ['No', 'Uncertain'], style: warnStyle },
            { key: 'is_new_domain', id1: 'age1', id2: 'age2', labels: ['Yes', 'Medium Risk'], alt: ['No', 'Safe'], style: warnStyle },
          ];

          for (const flag of flags) {
            const val = data[flag.key];
            if (val === true) {
              set(flag.id1, flag.labels[0], yesStyle);
              set(flag.id2, flag.labels[1], flag.style);
            } else {
              set(flag.id1, flag.alt[0], yesStyle);
              set(flag.id2, flag.alt[1], flag.key === 'is_parked' ? warnStyle : safeStyle);
            }
          }

          // Mailbox provider logic
          if (data.is_trusted_mbp === true) {
            set('mbp2', data.mbp, yesStyle);
            set('mbp3', 'Safe', safeStyle);
          } else if (data.mx === null || data.mx === 'None') {
            set('mbp2', 'No MX recorded', yesStyle);
            set('mbp3', 'Neutral', warnStyle);
          } else if (data.mx_status === 'OK' && data.is_trusted_mbp === false) {
            set('mbp2', 'Safe', yesStyle);
            set('mbp3', 'Neutral', warnStyle);
          } else if (data.mx_status !== 'OK' && data.is_trusted_mbp === false) {
            set('mbp2', 'UnSafe', yesStyle);
            set('mbp3', 'High Risk', dangerStyle);
          } else {
            set('mbp2', 'Neutral', yesStyle);
            set('mbp3', 'Neutral', warnStyle);
          }

          // TLD
          const tldlookup = ['cc', 'ru', 'cn', 'my', 'co'];
          set('tld1', data.suffix, yesStyle);
          set('tld2', tldlookup.includes(data.suffix) ? 'Medium Risk' : 'Neutral', tldlookup.includes(data.suffix) ? warnStyle : safeStyle);

          // IP and A Record
          if (data.a) {
            set('ip1', data.isp, yesStyle);
            set('ip2', 'Safe', safeStyle);
          } else {
            set('ip1', 'No A record', yesStyle);
            set('ip2', 'Neutral', warnStyle);
          }

          // Decision Flag
          const flaggedDiv = document.getElementById('flagdiv');
          if (flaggedDiv) {
            flaggedDiv.style.backgroundColor = data.decision_flag ? 'lightgreen' : 'lightcoral';
          }
          set('decision-flag', data.decision_flag ? 'Mailable' : 'Reject');

          // General Info
          set('domain', data.domain);
          set('mbp', data.mbp);
          set('tld_country', data.tld_country);
          set('tld_manager', data.tld_manager);
          set('toprank', data.top_domain_rank ? data.top_domain_rank.toLocaleString() : 'Not in Top 1M');
          set('isp1', data.isp);
          set('ispc1', data.isp_country);
          set('webmail1', data.webmail_group);
          set('webmailcountry1', data.webmail_country);

          // DNS records
          set('a1', data.a);
          set('aaaa1', data.aaaa);
          set('ns1', data.ns);
          set('soa1', data.soa);
          set('ptr1', data.ptr);
          set('cname1', data.cname);
          set('mx1', data.mx);
          set('spf1', data.spf ? 'Yes' : 'No', yesStyle);
          set('dmarc1', data.dmarc ? 'Yes' : 'No', yesStyle);
          set('bimi1', data.bimi === true ? 'Yes' : data.bimi === false ? 'No' : 'Unknown', yesStyle);

          set('www', `www.${data.domain}`);
          set('wwwa1', data.www);
          set('wwwptr1', data.www_ptr);
          set('wwwcname1', data.www_cname);
          set('mail', `mail.${data.domain}`);
          set('maila1', data.mail_a);
          set('mailptr1', data.mail_ptr);
          set('mailmx1', data.mail_mx);
          set('mailspf1', data.mail_spf);
          set('maildmarc1', data.mail_dmarc);
        }

</script>