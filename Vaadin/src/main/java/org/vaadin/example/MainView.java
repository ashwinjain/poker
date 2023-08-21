
package org.vaadin.example;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.dependency.JavaScript;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.router.Route;

@JavaScript("./script.js")
@Route
public class MainView extends Div {

    // at the start of each new game when the cards are dealt, create a new
    // MainActivity
    // create a list in order of who would win, and send that list back to the js
    // file

    public MainView() {
        add(new Html("""
                <body>hello world</body>
                """));
        callJs();
    }

    @ClientCallable
    public void greet() {
        Poker poker = new Poker("z2s", "z3s");
        int winner = poker.getWinner();
        System.out.println("winner is " + winner);
    }

    private void callJs() {
        getElement().executeJs("greet($0, $1)", "ashwin", getElement());
    }
}