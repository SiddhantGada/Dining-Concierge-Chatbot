import React, { Component } from 'react';
import './App.css';
import './hello.js';

class App extends Component {
  render() {
    return (
      <body>
      <div>
      <div id='bodybox'>
    <div id='chatborder'>
      <p id="chatlog7" class="chatlog">&nbsp;</p>
      <p id="chatlog6" class="chatlog">&nbsp;</p>
      <p id="chatlog5" class="chatlog">&nbsp;</p>
      <p id="chatlog4" class="chatlog">&nbsp;</p>
      <p id="chatlog3" class="chatlog">&nbsp;</p>
      <p id="chatlog2" class="chatlog">&nbsp;</p>
      <p id="chatlog1" class="chatlog">&nbsp;</p>
      <input type="text" name="chat" id="chatbox" placeholder="Hi there! Type here to talk to me." onfocus="placeHolder()"/>
    </div>
  </div>
</div>

</body>
    );
  }
}



export default App;
