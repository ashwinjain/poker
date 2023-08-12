
package org.vaadin.example;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.dependency.JavaScript;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.router.Route;

@JavaScript("./script.js")
@Route
public class MainView extends Div {

    public MainView() {
        add(new H1("hello!"));
        callJs();
    }

    @ClientCallable
    public void greet() {
        Poker poker = new Poker();
        int winner = poker.getWinner();
        System.out.println("winner is " + winner);
    }

    private void callJs() {
        getElement().executeJs("greet($0, $1)", "ashwin", getElement());
    }
}