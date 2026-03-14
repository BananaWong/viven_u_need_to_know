import Icons from '../components/Icons';

export const SYMMETRICAL_RISK_DATA = [
    {
        id: 'plastics', side: 'left', num: '01', value: '5g', label: 'MICROPLASTICS',
        headline: `You ingest a credit card's weight in plastic every week.`,
        details: `Microplastics carry toxins & have been found collecting in human organs.`,
        consequence: 'Cellular Inflammation'
    },
    {
        id: 'pfas', side: 'left', num: '02', value: '45%', label: 'PFAS\n(FOREVER\nCHEMICALS)',
        headline: `Forever chemicals detected in nearly half of U.S. tap water.`,
        details: `These man-made compounds do not break down and steadily accumulate in your body over time.`,
        consequence: 'Immune Suppression'
    },
    {
        id: 'lead', side: 'left', num: '03', value: '100%', label: 'LEAD & HEAVY\nMETALS',
        headline: `Aging infrastructure leaches lead directly into your tap.`,
        details: `Even at trace levels, lead from old city pipes accumulates in human bones and the brain.`,
        consequence: 'Cognitive Decline'
    },
    {
        id: `pharmaceuticals`, side: `right`, num: `04`, value: `4,000+`, label: `PHARMACEUTICALS`,
        headline: `Traces of over 4,000 different drugs are found in tap water.`,
        details: `Medications from hormones to antidepressants enter the water system through human waste and improper disposal.`,
        consequence: `Hormonal Disruption`
    },
    {
        id: 'disinfectants', side: 'right', num: '05', value: '70%', label: `DISINFECTION\nBYPRODUCTS\n(THMs, HAA9,\nCHLOROFORM)`,
        headline: `DBPs form when chlorine reacts with organic matter.`,
        details: `These byproducts are often more toxic than the chlorine itself and are completely invisible.`,
        consequence: 'Cellular Damage'
    },
    {
        id: 'chlorine', side: 'right', num: '06', value: '98%', label: 'CHLORINE &\nCHLORAMINE',
        headline: `Added to kill bacteria, but destroys your microbiome.`,
        details: `Chlorine doesn't distinguish between bad bacteria in pipes and good gut flora in your stomach.`,
        consequence: 'Gut Dysbiosis'
    }
];

export const CALENDAR_EVENTS = [
    {
        id: 'coffee',
        startTime: '08:00 AM',
        title: 'Morning Coffee',
        location: 'Mineralized water',
        color: 'bg-[#f2663b]', // Orange
        Icon: Icons.Coffee,
        videoUrl: 'https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1772180512/Fill_Glass_brgdap.mp4',
        poster: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'school',
        startTime: '08:30 AM',
        title: `Fill Kids' Bottles`,
        location: 'Mineralized water',
        color: 'bg-[#f2663b]', // Orange
        Icon: Icons.Bottle,
        videoUrl: 'https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1772182321/Fill_Bottle_xeozsd.mp4',
        poster: 'https://images.unsplash.com/photo-1551021703-35b9474bd260?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'work-sync',
        startTime: '09:30 AM',
        title: 'Team Sync & Planning',
        location: 'Home Office',
        color: 'bg-stone-400', // Grey
        Icon: Icons.Briefcase,
        videoUrl: null,
        imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: 'lunch',
        startTime: '12:30 PM',
        title: 'Lunch Prep',
        location: 'Filtered water',
        color: 'bg-[#007AFF]', // Blue (Filtration)
        Icon: Icons.Utensils,
        videoUrl: 'https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1772182404/Wash_Produce_vyiydf.mp4',
        poster: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'client-call',
        startTime: '02:00 PM',
        title: 'Client Review',
        location: 'Phone',
        color: 'bg-stone-400', // Grey
        Icon: Icons.VideoCall,
        videoUrl: null,
        imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: 'dinner',
        startTime: '04:30 PM',
        title: 'Dinner Prep',
        location: 'Filtered water',
        color: 'bg-[#007AFF]', // Blue (Filtration)
        Icon: Icons.Utensils,
        videoUrl: 'https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1772182571/Fill_Pot_Landsape_re7hl7.mp4',
        poster: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'bedtime',
        startTime: '09:00 PM',
        title: 'Night Routine',
        location: 'Hydrogen water',
        color: 'bg-[#34C759]', // Green
        Icon: Icons.Moon,
        videoUrl: 'https://res.cloudinary.com/dsyxtnpgm/video/upload/q_auto,f_auto/v1771699978/121A6311_bqnzxz.mp4',
        poster: 'https://images.unsplash.com/photo-1511275539165-cc46b1ee8960?q=80&w=1200&auto=format&fit=crop'
    }
];

export const PRODUCT_FINISHES = [
    { id: 'matte-black',    label: 'Matte Black',    color: '#1A1A1C', textMode: 'dark',  desc: `A bold, light-absorbing finish. Fingerprint resistant and unapologetically modern.`,        img: `https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772698702/black_vuby1n.webp` },
    { id: 'brushed-nickel', label: 'Brushed Nickel', color: '#F0F0F2', textMode: 'light', desc: `Timeless and versatile. Designed to match your stainless steel appliances perfectly.`,    img: `https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772698702/Brushed_Nickel_lbkocf.webp` },
    { id: 'brushed-bronze', label: 'Brushed Bronze', color: '#8A6B4E', textMode: 'dark',  desc: `Warm and inviting. Adds a subtle, sophisticated touch of vintage luxury to your kitchen.`, img: `https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772698702/Brushed_Bronze_xjzc8z.webp` },
    { id: 'brushed-brass',  label: 'Brushed Brass',  color: '#C4A052', textMode: 'dark',  desc: `Radiant and classic. A jewel-like finish that brings a golden warmth to the space.`,      img: `https://res.cloudinary.com/dsyxtnpgm/image/upload/v1772698701/Brushed_Brass_wiskfq.webp` },
];

export const INITIAL_DISCUSSION_POSTS = [
    { id: 1, author: 'Jennifer K.', location: 'San Francisco, CA', avatar: 'JK', time: '2 days ago', text: `Can't believe what was in our water. My kids actually drink more water now. My daughter used to complain it tasted 'weird' — she doesn't anymore.`, likes: 24, liked: false },
    { id: 2, author: 'Sarah M.',    location: 'Austin, TX',         avatar: 'SM', time: '4 days ago', text: `I was dreading the install but it literally took me 7 minutes. Easier than replacing my old faucet. Seriously.`,                               likes: 18, liked: false },
    { id: 3, author: 'David R.',    location: 'Chicago, IL',        avatar: 'DR', time: '1 week ago', text: `I'm an engineer and I was skeptical about the hydrogen water claims. But the filtration specs check out — that's what sold me. The hydrogen is a bonus.`, likes: 31, liked: false },
    { id: 4, author: `Michelle T.`, location: `Seattle, WA`,        avatar: `MT`, time: `1 week ago`, text: `My husband and I have been debating this for months. The $95 refundable deposit finally made us pull the trigger. No risk, right?`,            likes: 15, liked: false },
];

export const FAQ_DATA = [
    {
        question: `What’s the benefit of hydrogen water from my faucet?`,
        answer: `Hydrogen water contains molecular hydrogen (H₂) gas, a safe and potent antioxidant studied extensively for its potential to support energy, reduce inflammation, and help your body recover faster. Many people already buy hydrogen tablets or bottles—Viven gives you the same benefit instantly, with no extra steps and no subscription.`
    },
    {
        question: `Why do I need minerals added back to filtered water?`,
        answer: `Most filtration systems strip out both harmful contaminants and essential minerals like calcium, magnesium, and sodium. Without these, water tastes slightly bitter and hydration is compromised. These minerals regulate fluid levels, influence muscle contractions, and help your body absorb and use water effectively. And in the right ratios help the water taste delicious.`
    },
    {
        question: `Is this better than a regular filter or pitcher?`,
        answer: `Yes. Viven not only filters out contaminants—it enhances your water in three key ways:\n\n• Adds electrolytes back in\n• Infuses hydrogen when you want it\n\nAnd it doesn’t waste water like RO systems do.`
    },
    {
        question: `Does it work with my smart home setup?`,
        answer: `Yes. Viven integrates with Apple Home, Amazon Alexa, and Google Home. You can track usage and control settings through the Viven app for temperature, water modes, and check filter life. You can also set up optional goals and smart reminders for getting your supplement and/or drinking water daily/weekly/monthly.`
    },
    {
        question: `How hard is it to install?`,
        answer: `Most users install it in under 10 minutes. The faucet installs from above the sink with a custom tool we provide. The under-sink unit connects with three push-to-connect hoses and a power cord. It's often faster to install Viven than to remove your old faucet.`
    },
    {
        question: `How long do the cartridges last?`,
        answer: `Each cartridge lasts 6–9 months depending on usage. The app tracks filter life and lets you reorder with one tap—or set up auto-refills for convenience.`
    },
    {
        question: `What happens to the old cartridges?`,
        answer: `We make it super easy for you to ship your old cartridges back to us when you get your new cartridges from us so we can recycle the materials that can be recycled and dispose of the contaminants appropriately so they don’t leach back into the water system.\n\nWe also provide free shipping for sending us your old kitchen faucet that you would replace with ours. We do this to recycle what we can and help keep the environment clean of materials that pollute our water (many finishes use chemicals like hexavalent chromium that end up in water and are bad for us).`
    },
    {
        question: `How do I cancel/get a refund?`,
        answer: `Just email us at hello@vivenwater.com with your cancellation request. We will process your full refund within 7 business days to your original form of payment. No questions asked.`
    },
    {
        question: `How much is the Viven Kitchen Faucet+ and what is the discount?`,
        answer: `$899 for the **first 1000** backers who reserve now.\n\nOur retail price at launch is $1099.\n\nYour $50 one-time reservation deposit gets you **$200 off** the retail price.`
    }
];

export const MARKET_COMPARISON_DATA = [
    { label: `Modern contaminants treated`, viven: `YES`, tap: `NO`, pitcherFridge: `NO`, bottled: `NO`, wholeHome: `NO`, ro: `YES` },
    { label: `Essential Minerals Added`, viven: `YES`, tap: `NO`, pitcherFridge: `NO`, bottled: `NO`, wholeHome: `NO`, ro: `NO` },
    { label: `Water not wasted`, viven: `YES`, tap: `-`, pitcherFridge: `-`, bottled: `NO`, wholeHome: `NO`, ro: `NO` },
    { label: `High flow rate`, viven: `YES`, tap: `YES`, pitcherFridge: `NO`, bottled: `NO`, wholeHome: `YES`, ro: `NO` },
    { label: `Easy installation\n(no plumbers needed)`, viven: `YES`, tap: `-`, pitcherFridge: `YES`, bottled: `-`, wholeHome: `NO`, ro: `NO` },
    { label: `Comprehensive NSF Certification`, viven: `YES`, tap: `NO`, pitcherFridge: `NO`, bottled: `NO`, wholeHome: `NO`, ro: `NO` }
];

export const TERMS_OF_SERVICE = {
    title: `Website Terms of Use`,
    content: (
        <>
            <p className="text-sm text-stone-400 mb-8">Version 1.0<br />Last revised on: June 6, 2025</p>
            
            <p>The website located at www.vivenwater.com (the “Site”) is a copyrighted work belonging to Viven, Inc. (“Company”, “us”, “our”, and “we”). Certain features of the Site may be subject to additional guidelines, terms, or rules, which will be posted on the Site in connection with such features. All such additional terms, guidelines, and rules are incorporated by reference into these Terms.</p>
            
            <p>These Terms of Use (these “Terms”) set forth the legally binding terms and conditions that govern your use of the Site. By accessing or using the Site, you are accepting these Terms (on behalf of yourself or the entity that you represent), and you represent and warrant that you have the right, authority, and capacity to enter into these Terms (on behalf of yourself or the entity that you represent). You may not access or use the Site or accept the Terms if you are not at least 18 years old. If you do not agree with all of the provisions of these Terms, do not access and/or use the Site.</p>

            <div className="bg-stone-100 p-6 rounded-lg mb-8 border border-stone-200">
                <p className="font-bold mb-4 uppercase text-xs">PLEASE BE AWARE THAT SECTION 8.2 CONTAINS PROVISIONS GOVERNING HOW TO RESOLVE DISPUTES BETWEEN YOU AND COMPANY. AMONG OTHER THINGS, SECTION 8.2 INCLUDES AN AGREEMENT TO ARBITRATE WHICH REQUIRES, WITH LIMITED EXCEPTIONS, THAT ALL DISPUTES BETWEEN YOU AND US SHALL BE RESOLVED BY BINDING AND FINAL ARBITRATION. SECTION 8.2 ALSO CONTAINS A CLASS ACTION AND JURY TRIAL WAIVER. PLEASE READ SECTION 8.2 CAREFULLY.</p>
                <p className="text-sm font-bold">UNLESS YOU OPT OUT OF THE AGREEMENT TO ARBITRATE WITHIN 30 DAYS: (1) YOU WILL ONLY BE PERMITTED TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF AGAINST US ON AN INDIVIDUAL BASIS, NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION OR PROCEEDING AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION; AND (2) YOU ARE WAIVING YOUR RIGHT TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF IN A COURT OF LAW AND TO HAVE A JURY TRIAL.</p>
            </div>

            <h2>1. Accounts</h2>
            <p><strong>1.1 Account Creation.</strong> In order to use certain features of the Site, you must register for an account (“Account”) and provide certain information about yourself as prompted by the account registration form. You represent and warrant that: (a) all required registration information you submit is truthful and accurate; (b) you will maintain the accuracy of such information. You may delete your Account at any time, for any reason, by following the instructions on the Site. Company may suspend or terminate your Account in accordance with Section 7.</p>
            <p><strong>1.2 Account Responsibilities.</strong> You are responsible for maintaining the confidentiality of your Account login information and are fully responsible for all activities that occur under your Account. You agree to immediately notify Company of any unauthorized use, or suspected unauthorized use of your Account or any other breach of security. Company cannot and will not be liable for any loss or damage arising from your failure to comply with the above requirements.</p>

            <h2>2. Access to the Site</h2>
            <p><strong>2.1 License.</strong> Subject to these Terms, Company grants you a non-transferable, non-exclusive, revocable, limited license to use and access the Site solely for your own personal, noncommercial use.</p>
            <p><strong>2.2 Certain Restrictions.</strong> The rights granted to you in these Terms are subject to the following restrictions: (a) you shall not license, sell, rent, lease, transfer, assign, distribute, host, or otherwise commercially exploit the Site, whether in whole or in part, or any content displayed on the Site; (b) you shall not modify, make derivative works of, disassemble, reverse compile or reverse engineer any part of the Site; (c) you shall not access the Site in order to build a similar or competitive website, product, or service; and (d) except as expressly stated herein, no part of the Site may be copied, reproduced, distributed, republished, downloaded, displayed, posted or transmitted in any form or by any means. Unless otherwise indicated, any future release, update, or other addition to functionality of the Site shall be subject to these Terms. All copyright and other proprietary notices on the Site (or on any content displayed on the Site) must be retained on all copies thereof.</p>
            <p><strong>2.3 Modification.</strong> Company reserves the right, at any time, to modify, suspend, or discontinue the Site (in whole or in part) with or without notice to you. You agree that Company will not be liable to you or to any third party for any modification, suspension, or discontinuation of the Site or any part thereof.</p>
            <p><strong>2.4 No Support or Maintenance.</strong> You acknowledge and agree that Company will have no obligation to provide you with any support or maintenance in connection with the Site.</p>
            <p><strong>2.5 Ownership.</strong> You acknowledge that all the intellectual property rights, including copyrights, patents, trade marks, and trade secrets, in the Site and its content are owned by Company or Company’s suppliers. Neither these Terms (nor your access to the Site) transfers to you or any third party any rights, title or interest in or to such intellectual property rights, except for the limited access rights expressly set forth in Section 2.1. Company and its suppliers reserve all rights not granted in these Terms. There are no implied licenses granted under these Terms.</p>
            <p><strong>2.6 Feedback.</strong> If you provide Company with any feedback or suggestions regarding the Site (“Feedback”), you hereby assign to Company all rights in such Feedback and agree that Company shall have the right to use and fully exploit such Feedback and related information in any manner it deems appropriate. Company will treat any Feedback you provide to Company as non-confidential and non-proprietary. You agree that you will not submit to Company any information or ideas that you consider to be confidential or proprietary.</p>

            <h2>3. Indemnification</h2>
            <p>You agree to indemnify and hold Company (and its officers, employees, and agents) harmless, including costs and attorneys’ fees, from any claim or demand made by any third party due to or arising out of (a) your use of the Site, (b) your violation of these Terms or (c) your violation of applicable laws or regulations. Company reserves the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate with our defense of these claims. You agree not to settle any matter without the prior written consent of Company. Company will use reasonable efforts to notify you of any such claim, action or proceeding upon becoming aware of it.</p>

            <h2>4. Third-Party Links & Ads; Other Users</h2>
            <p><strong>4.1 Third-Party Links & Ads.</strong> The Site may contain links to third-party websites and services, and/or display advertisements for third parties (collectively, “Third-Party Links & Ads”). Such Third-Party Links & Ads are not under the control of Company, and Company is not responsible for any Third-Party Links & Ads. Company provides access to these Third-Party Links & Ads only as a convenience to you, and does not review, approve, monitor, endorse, warrant, or make any representations with respect to Third-Party Links & Ads. You use all Third-Party Links & Ads at your own risk, and should apply a suitable level of caution and discretion in doing so. When you click on any of the Third-Party Links & Ads, the applicable third party’s terms and policies apply, including the third party’s privacy and data gathering practices. You should make whatever investigation you feel necessary or appropriate before proceeding with any transaction in connection with such Third-Party Links & Ads.</p>
            <p><strong>4.2 Other Users.</strong> Your interactions with other Site users are solely between you and such users. You agree that Company will not be responsible for any loss or damage incurred as the result of any such interactions. If there is a dispute between you and any Site user, we are under no obligation to become involved.</p>
            <p><strong>4.3 Release.</strong> You hereby release and forever discharge Company (and our officers, employees, agents, successors, and assigns) from, and hereby waive and relinquish, each and every past, present and future dispute, claim, controversy, demand, right, obligation, liability, action and cause of action of every kind and nature (including personal injuries, death, and property damage), that has arisen or arises directly or indirectly out of, or that relates directly or indirectly to, the Site (including any interactions with, or act or omission of, other Site users or any Third-Party Links & Ads). IF YOU ARE A CALIFORNIA RESIDENT, YOU HEREBY WAIVE CALIFORNIA CIVIL CODE SECTION 1542 IN CONNECTION WITH THE FOREGOING, WHICH STATES: “A GENERAL RELEASE DOES NOT EXTEND TO CLAIMS WHICH THE CREDITOR OR RELEASING PARTY DOES NOT KNOW OR SUSPECT TO EXIST IN HIS OR HER FAVOR AT THE TIME OF EXECUTING THE RELEASE, WHICH IF KNOWN BY HIM OR HER MUST HAVE MATERIALLY AFFECTED HIS OR HER SETTLEMENT WITH THE DEBTOR OR RELEASED PARTY.”</p>

            <h2>5. Disclaimers</h2>
            <p className="uppercase font-bold text-xs tracking-widest leading-relaxed">THE SITE IS PROVIDED ON AN “AS-IS” AND “AS AVAILABLE” BASIS, AND COMPANY (AND OUR SUPPLIERS) EXPRESSLY DISCLAIM ANY AND ALL WARRANTIES AND CONDITIONS OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING ALL WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, OR NON-INFRINGEMENT. WE (AND OUR SUPPLIERS) MAKE NO WARRANTY THAT THE SITE WILL MEET YOUR REQUIREMENTS, WILL BE AVAILABLE ON AN UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE BASIS, OR WILL BE ACCURATE, RELIABLE, FREE OF VIRUSES OR OTHER HARMFUL CODE, COMPLETE, LEGAL, OR SAFE. IF APPLICABLE LAW REQUIRES ANY WARRANTIES WITH RESPECT TO THE SITE, ALL SUCH WARRANTIES ARE LIMITED IN DURATION TO 90 DAYS FROM THE DATE OF FIRST USE.</p>
            <p className="uppercase font-bold text-xs tracking-widest leading-relaxed mt-4">SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO THE ABOVE EXCLUSION MAY NOT APPLY TO YOU. SOME JURISDICTIONS DO NOT ALLOW LIMITATIONS ON HOW LONG AN IMPLIED WARRANTY LASTS, SO THE ABOVE LIMITATION MAY NOT APPLY TO YOU.</p>

            <h2>6. Limitation on Liability</h2>
            <p className="uppercase font-bold text-xs tracking-widest leading-relaxed">TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL COMPANY (OR OUR SUPPLIERS) BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY LOST PROFITS, LOST DATA, COSTS OF PROCUREMENT OF SUBSTITUTE PRODUCTS, OR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL OR PUNITIVE DAMAGES ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF, OR INABILITY TO USE, THE SITE, EVEN IF COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. ACCESS TO, AND USE OF, THE SITE IS AT YOUR OWN DISCRETION AND RISK, AND YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR DEVICE OR COMPUTER SYSTEM, OR LOSS OF DATA RESULTING THEREFROM.</p>
            <p className="uppercase font-bold text-xs tracking-widest leading-relaxed mt-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY DAMAGES ARISING FROM OR RELATED TO THESE TERMS (FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION), WILL AT ALL TIMES BE LIMITED TO A MAXIMUM OF FIFTY US DOLLARS. THE EXISTENCE OF MORE THAN ONE CLAIM WILL NOT ENLARGE THIS LIMIT. YOU AGREE THAT OUR SUPPLIERS WILL HAVE NO LIABILITY OF ANY KIND ARISING FROM OR RELATING TO THESE TERMS. SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATION OR EXCLUSION MAY NOT APPLY TO YOU.</p>

            <h2>7. Term and Termination</h2>
            <p>Subject to this Section, these Terms will remain in full force and effect while you use the Site. We may suspend or terminate your rights to use the Site (including your Account) at any time for any reason at our sole discretion, including for any use of the Site in violation of these Terms. Upon termination of your rights under these Terms, your Account and right to access and use the Site will terminate immediately. Company will not have any liability whatsoever to you for any termination of your rights under these Terms, including for termination of your Account. Even after your rights under these Terms are terminated, the following provisions of these Terms will remain in effect: Sections 2.2 through 2.6 and Sections 3 through 8.</p>

            <h2>8. General</h2>
            <p><strong>8.1 Changes.</strong> These Terms are subject to occasional revision, and if we make any substantial changes, we may notify you by sending you an e-mail to the last e-mail address you provided to us (if any), and/or by prominently posting notice of the changes on our Site. You are responsible for providing us with your most current e-mail address. Continued use of our Site following notice of such changes shall indicate your acknowledgement of such changes and agreement to be bound by the terms and conditions of such changes.</p>
            
            <p><strong>8.2 Dispute Resolution.</strong> Please read the following arbitration agreement in this Section carefully. It requires you to arbitrate disputes with Company and limits the manner in which you can seek relief from the Company Parties.</p>
            
            <p><strong>(a) Applicability of Arbitration Agreement.</strong> You agree that any dispute between you and any of the Company Parties relating in any way to the Site, the services offered on the Site (the “Services”) or these Terms will be resolved by binding arbitration, rather than in court, except that (1) you and the Company Parties may assert individualized claims in small claims court if the claims qualify, remain in such court and advance solely on an individual, non-class basis; and (2) you or the Company Parties may seek equitable relief in court for infringement or other misuse of intellectual property rights. This Arbitration Agreement shall survive the expiration or termination of these Terms.</p>
            
            <p><strong>(b) Informal Dispute Resolution.</strong> There might be instances when a Dispute arises between you and Company. If that occurs, Company is committed to working with you to reach a reasonable resolution. You and Company therefore agree that before either party commences arbitration against the other, we will personally meet and confer telephonically or via videoconference, in a good faith effort to resolve informally any Dispute covered by this Arbitration Agreement.</p>
            
            <p><strong>(c) Arbitration Rules and Forum.</strong> If the Informal Dispute Resolution Process does not resolve satisfactorily within 60 days, you and Company agree that either party shall have the right to finally resolve the Dispute through binding arbitration. The Federal Arbitration Act governs the interpretation and enforcement of this Arbitration Agreement. The arbitration will be conducted by JAMS.</p>
            
            <p><strong>(d) Waiver of Jury Trial.</strong> YOU AND THE COMPANY PARTIES HEREBY WAIVE ANY CONSTITUTIONAL AND STATUTORY RIGHTS TO SUE IN COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR A JURY.</p>
            
            <p><strong>(e) Waiver of Class or Other Non-Individualized Relief.</strong> YOU AND COMPANY AGREE THAT EACH OF US MAY BRING CLAIMS AGAINST THE OTHER ONLY ON AN INDIVIDUAL BASIS AND NOT ON A CLASS, REPRESENTATIVE, OR COLLECTIVE BASIS.</p>

            <p><strong>8.3 Export.</strong> The Site may be subject to U.S. export control laws and may be subject to export or import regulations in other countries. You agree not to export, reexport, or transfer, directly or indirectly, any U.S. technical data acquired from Company.</p>
            
            <p><strong>8.4 Electronic Communications.</strong> The communications between you and Company use electronic means, whether you use the Site or send us emails, or whether Company posts notices on the Site or communicates with you via email.</p>
            
            <p><strong>8.5 Entire Terms.</strong> These Terms constitute the entire agreement between you and us regarding the use of the Site.</p>
            
            <h2>Contact Information</h2>
            <div className="not-prose bg-stone-50 p-6 rounded-lg border border-stone-100">
                <p className="font-semibold text-[#2A2422] mb-1">Shashank Varma</p>
                <p className="text-stone-600 mb-4">10182 Parish Place, Cupertino, California 95014</p>
                <div className="flex flex-col gap-1 text-sm text-stone-600 font-medium">
                    <p><span className="text-stone-400 uppercase font-mono text-[10px] tracking-widest mr-2">Email:</span> <a href="mailto:hello@vivenwater.com" className="text-[#f2663b] hover:underline">hello@vivenwater.com</a></p>
                    <p><span className="text-stone-400 uppercase font-mono text-[10px] tracking-widest mr-2">Phone:</span> <a href="tel:+14083573837" className="text-[#f2663b] hover:underline">+1 408-357-3837</a></p>
                </div>
            </div>
        </>
    )
};


export const PRIVACY_POLICY = {
    title: `Privacy Policy`,
    content: (
        <>
            <p className="text-sm text-stone-400 mb-8">Last updated: June 08, 2025</p>

            <p>This Privacy Notice for Viven, Inc. ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you visit our website at <a href="https://www.vivenwater.com" className="text-[#f2663b] hover:underline">https://www.vivenwater.com</a> or engage with us in other related ways.</p>

            <div className="bg-[#f2663b]/5 border border-[#f2663b]/10 p-6 rounded-xl mb-12">
                <h2 className="text-[#f2663b] mt-0 text-xl tracking-tight uppercase">Summary of Key Points</h2>
                <p className="text-sm leading-relaxed text-stone-700">We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We do not collect any information from third parties. We have adequate organizational and technical processes in place to protect your personal information.</p>
            </div>

            <h2>1. WHAT INFORMATION DO WE COLLECT?</h2>
            <p><strong>Personal information you disclose to us:</strong> We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Names, mailing addresses, billing addresses</li>
                <li>Email addresses and phone numbers</li>
                <li>Financial data (All payment data is handled and stored by Stripe: <a href="https://stripe.com/privacy" className="text-[#f2663b]">stripe.com/privacy</a>)</li>
            </ul>

            <h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
            <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>To facilitate account creation and authentication.</li>
                <li>To respond to user inquiries and offer support.</li>
                <li>To send administrative information to you.</li>
                <li>To fulfill and manage your orders.</li>
                <li>To save or protect an individual's vital interest.</li>
            </ul>

            <h2>3. WHAT LEGAL BASES DO WE RELY ON?</h2>
            <p>We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law, such as with your consent, to comply with laws, or to fulfill our contractual obligations.</p>

            <h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
            <p>We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us, including: Ad Networks, Data Storage Providers, Payment Processors (Stripe), Social Networks, and Website Hosting Providers.</p>

            <h2>5. DO WE USE COOKIES?</h2>
            <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. We use Google Analytics to track and analyze usage. To opt out of being tracked by Google Analytics, visit <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#f2663b]">tools.google.com/dlpage/gaoptout</a>.</p>

            <h2>6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
            <p>We keep your information for as long as necessary to fulfill the purposes outlined in this notice. No purpose in this notice will require us keeping your personal information for longer than twelve (12) months past the termination of the user's account.</p>

            <h2>7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
            <p>We have implemented appropriate and reasonable technical and organizational security measures. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</p>

            <h2>8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
            <p>We do not knowingly collect data from or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or the equivalent age as specified by law in your jurisdiction.</p>

            <h2>9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
            <p>Depending on where you are located, you may have rights to access, rectify, or erase your personal information. You can exercise these rights by contacting us at hello@vivenwater.com.</p>

            <h2>10. UNITED STATES SPECIFIC PRIVACY RIGHTS</h2>
            <p>If you are a resident of California, Colorado, Connecticut, Virginia, or other qualifying states, you have specific rights to request access to and receive details about the personal information we maintain about you. We only collect sensitive personal information (like credit card numbers) as needed to provide Services and handle payments via Stripe.</p>

            <h2>11. HOW CAN YOU CONTACT US?</h2>
            <div className="not-prose bg-stone-50 p-6 rounded-lg border border-stone-100">
                <p className="font-semibold text-[#2A2422] mb-1">Viven, Inc.</p>
                <p className="text-stone-600 mb-4">Attn: Data Protection Officer<br />10182 Parish Place, Cupertino, California 95014</p>
                <p className="text-sm"><span className="text-stone-400 uppercase font-mono text-[10px] tracking-widest mr-2">Email:</span> <a href="mailto:hello@vivenwater.com" className="text-[#f2663b] hover:underline">hello@vivenwater.com</a></p>
            </div>
        </>
    )
};
