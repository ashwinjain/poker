package org.vaadin.example;

import java.util.ArrayList;

import org.vaadin.example.helpers.Card;
import org.vaadin.example.helpers.Hand;
import org.vaadin.example.helpers.HandController;
import org.vaadin.example.helpers.Card.Suit;

public class Poker {

    private int winner;

    public Poker() {
        ArrayList<Card> playerCards = new ArrayList<Card>();
        ArrayList<Card> dealerCards = new ArrayList<Card>();

        Card tenSpades = new Card(10, Suit.SPADES);
        Card jackSpades = new Card(11, Suit.SPADES);
        Card queenSpades = new Card(12, Suit.SPADES);
        Card kingSpades = new Card(13, Suit.SPADES);
        Card aceSpades = new Card(14, Suit.SPADES);
        Card oneDiamond = new Card(1, Suit.DIAMONDS);

        playerCards.add(tenSpades);
        playerCards.add(jackSpades);
        playerCards.add(queenSpades);
        playerCards.add(kingSpades);
        playerCards.add(aceSpades);
        playerCards.add(aceSpades);
        playerCards.add(aceSpades);

        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);
        dealerCards.add(oneDiamond);

        Hand playerHand = new Hand(playerCards);
        Hand dealerHand = new Hand(dealerCards);

        HandController controller = new HandController();
        winner = controller.compareHands(dealerHand, playerHand);

        // System.out.println(String.valueOf(winner));
    }

    public int getWinner() {
        return winner;
    }
}